import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ME_template, METemplateDocument } from './schema';
import { CreateMETemplateDto } from './dto.create';
import { UpdateMETemplateDto } from './dto.update';
import { QueryMETemplateDto, SortTypeEnum } from './dto.query';
import { IMETemplate, IMETemplateResponse } from './interface';
import { UserDocument } from '../../schema';

@Injectable()
export class METemplateService {
  constructor(
    @InjectModel(ME_template.name) 
    private readonly templateModel: Model<METemplateDocument>,
  ) {}

  async create(data: CreateMETemplateDto, user: UserDocument): Promise<IMETemplate> {
    // Extract user ID properly from different possible structures
    const userId = user._id || user.id || (user as any).customer?.id;
    
    // Convert to ObjectId if it's a string
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    // Check if template with same name exists for this user
    const exists = await this.templateModel.findOne({
      name: data.name,
      creator: userObjectId
    });

    if (exists) {
      throw new ConflictException(`Template with name "${data.name}" already exists`);
    }

    const createData = {
      ...data,
      creator: userObjectId
    };

    const newTemplate = await this.templateModel.create(createData);
    return this.toInterface(newTemplate);
  }

  async findAll(query: QueryMETemplateDto, user: UserDocument): Promise<IMETemplateResponse> {
    const userId = user._id || user.id || (user as any).customer?.id;
    const filter = await this.buildFilter(query, user);
    
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    // Build sort object
    const sort: any = {};
    if (query.orderBy && query.sortType) {
      sort[query.orderBy] = query.sortType === SortTypeEnum.ASCENDING ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default sort by creation date descending
    }

    const [templates, total] = await Promise.all([
      this.templateModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(size)
        .exec(),
      this.templateModel.countDocuments(filter)
    ]);

    return {
      data: templates.map(template => this.toInterface(template)),
      total,
      page,
      size,
    };
  }

  async findById(id: string, user: UserDocument): Promise<IMETemplate> {
    const userId = user._id || user.id || (user as any).customer?.id;
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    const template = await this.templateModel
      .findOne({ _id: id, creator: userObjectId })
      .exec();
    
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return this.toInterface(template);
  }

  async update(id: string, data: UpdateMETemplateDto, user: UserDocument): Promise<IMETemplate> {
    const userId = user._id || user.id || (user as any).customer?.id;
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    const template = await this.templateModel.findOne({ _id: id, creator: userObjectId });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check if name is being changed and if it conflicts
    if (data.name && data.name !== template.name) {
      const exists = await this.templateModel.findOne({
        name: data.name,
        creator: userObjectId,
        _id: { $ne: id }
      });

      if (exists) {
        throw new ConflictException(`Template with name "${data.name}" already exists`);
      }
    }

    const updatedTemplate = await this.templateModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();
    
    return this.toInterface(updatedTemplate);
  }

  async delete(id: string, user: UserDocument): Promise<void> {
    const userId = user._id || user.id || (user as any).customer?.id;
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid template ID');
    }

    const template = await this.templateModel.findOne({ _id: id, creator: userObjectId });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    await this.templateModel.findByIdAndDelete(id);
  }

  async incrementUsage(id: string, user: UserDocument): Promise<void> {
    const userId = user._id || user.id || (user as any).customer?.id;
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    await this.templateModel.findOneAndUpdate(
      { _id: id, creator: userObjectId },
      { 
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() }
      }
    );
  }

  private async buildFilter(query: QueryMETemplateDto, user: UserDocument): Promise<any> {
    const userId = user._id || user.id || (user as any).customer?.id;
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const filter: any = { creator: userObjectId };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.contentType) {
      filter.contentType = query.contentType;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    // Date range filters
    if (query.createdFrom || query.createdTo) {
      filter.createdAt = {};
      if (query.createdFrom) filter.createdAt.$gte = new Date(query.createdFrom);
      if (query.createdTo) filter.createdAt.$lte = new Date(query.createdTo);
    }

    return filter;
  }

  private toInterface(doc: METemplateDocument): IMETemplate {
    if (!doc) return null;
    
    // Access the underlying mongoose document to get timestamps
    const docObj = doc as any;
    
    return {
      _id: doc._id.toString(),
      creator: doc.creator.toString(),
      name: doc.name,
      subject: doc.subject,
      content: doc.content,
      contentType: doc.contentType,
      isActive: doc.isActive,
      tags: doc.tags || [],
      description: doc.description,
      usageCount: doc.usageCount || 0,
      lastUsedAt: doc.lastUsedAt,
      createdAt: docObj.createdAt,
      updatedAt: docObj.updatedAt,
    };
  }
} 