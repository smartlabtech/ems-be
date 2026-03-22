import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ME_taggedBy, METaggedByDocument } from './schema';
import { ITaggedBy } from './interface';
import { CreateTaggedByDto } from './dto.create';
import { UpdateTaggedByDto } from './dto.update';
import { QueryTaggedByDto } from './dto.query';
import { UserDocument } from '../../schema';
import { ME_tag, METagDocument } from '../ME_tag/schema';
import { ME_email, MEEmailDocument } from '../ME_email/schema';
import { ME_message, MEMessageDocument } from '../ME_message/schema';
import { TaggedEntityType } from './enum';

@Injectable()
export class METaggedByService {
  constructor(
    @InjectModel(ME_taggedBy.name) private readonly taggedByModel: Model<METaggedByDocument>,
    @InjectModel(ME_tag.name) private readonly tagModel: Model<METagDocument>,
    @InjectModel(ME_email.name) private readonly emailModel: Model<MEEmailDocument>,
    @InjectModel(ME_message.name) private readonly messageModel: Model<MEMessageDocument>,
  ) {}

  private async validateReferences(createDto: CreateTaggedByDto, userId: any) {
    // Validate tag exists and belongs to user
    const tagExists = await this.tagModel.exists({ 
      _id: createDto.tagId, 
      creator: userId,
      status: 'active'
    });
    if (!tagExists) {
      throw new NotFoundException(`Tag with ID '${createDto.tagId}' not found or doesn't belong to you`);
    }
    
    // Validate entity exists and belongs to user
    if (createDto.entityType === TaggedEntityType.EMAIL) {
      const emailExists = await this.emailModel.exists({ 
        _id: createDto.entityId, 
        creator: userId 
      });
      if (!emailExists) {
        throw new NotFoundException(`Email with ID '${createDto.entityId}' not found or doesn't belong to you`);
      }
    } else if (createDto.entityType === TaggedEntityType.MESSAGE) {
      const messageExists = await this.messageModel.exists({ 
        _id: createDto.entityId, 
        creator: userId 
      });
      if (!messageExists) {
        throw new NotFoundException(`Message with ID '${createDto.entityId}' not found or doesn't belong to you`);
      }
    }
  }

  async createTaggedBy(createTaggedByDto: CreateTaggedByDto, creator: any): Promise<ITaggedBy> {
    const userId = creator._id || creator.id || creator.customer?.id;
    
    if (!userId) {
      throw new BadRequestException('Invalid user authentication');
    }
    
    // Validate references with user scope
    await this.validateReferences(createTaggedByDto, userId);
    
    // Check for existing relation
    const exists = await this.taggedByModel.findOne({ 
      entityType: createTaggedByDto.entityType,
      entityId: createTaggedByDto.entityId,
      tagId: createTaggedByDto.tagId, 
      creator: userId 
    });
    
    if (exists) {
      throw new ConflictException(`This tag is already assigned to this ${createTaggedByDto.entityType}.`);
    }
    
    const created = await this.taggedByModel.create({
      ...createTaggedByDto,
      creator: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.toInterface(created);
  }

  async findAllTaggedBys(query: QueryTaggedByDto, creator: any) {
    const userId = creator._id || creator.id || creator.customer?.id;
    const filter: any = { creator: userId };
    
    // Add specific filters
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.tagId) filter.tagId = query.tagId;
    
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    // If search is provided, use aggregation pipeline to search across related data
    if (query.search) {
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'me_email',
            let: { entityId: '$entityId', entityType: '$entityType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$entityId'] },
                      { $eq: ['$$entityType', TaggedEntityType.EMAIL] }
                    ]
                  }
                }
              }
            ],
            as: 'email'
          }
        },
        {
          $lookup: {
            from: 'me_message',
            let: { entityId: '$entityId', entityType: '$entityType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$entityId'] },
                      { $eq: ['$$entityType', TaggedEntityType.MESSAGE] }
                    ]
                  }
                }
              }
            ],
            as: 'message'
          }
        },
        {
          $lookup: {
            from: 'me_tag',
            localField: 'tagId',
            foreignField: '_id',
            as: 'tag'
          }
        },
        {
          $match: {
            $or: [
              { 'email.email': { $regex: query.search, $options: 'i' } },
              { 'email.firstName': { $regex: query.search, $options: 'i' } },
              { 'email.lastName': { $regex: query.search, $options: 'i' } },
              { 'email.mobile': { $regex: query.search, $options: 'i' } },
              { 'message.subject': { $regex: query.search, $options: 'i' } },
              { 'message.sender': { $regex: query.search, $options: 'i' } },
              { 'tag.name': { $regex: query.search, $options: 'i' } },
            ]
          }
        },
        {
          $project: {
            _id: 1,
            entityType: 1,
            entityId: 1,
            tagId: 1,
            status: 1,
            creator: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ];

      const [taggedBys, totalResult] = await Promise.all([
        this.taggedByModel.aggregate([...pipeline, { $skip: skip }, { $limit: size }]),
        this.taggedByModel.aggregate([...pipeline, { $count: 'total' }])
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      return {
        data: taggedBys.map(t => this.toInterface(t)),
        total,
        page,
        size,
      };
    } else {
      // Use regular find when no search is provided
      const [taggedBys, total] = await Promise.all([
        this.taggedByModel.find(filter).skip(skip).limit(size).exec(),
        this.taggedByModel.countDocuments(filter)
      ]);

      return {
        data: taggedBys.map(t => this.toInterface(t)),
        total,
        page,
        size,
      };
    }
  }

  async findTaggedByById(id: string, creator: UserDocument): Promise<ITaggedBy> {
    const taggedBy = await this.taggedByModel.findOne({ _id: id, creator: creator._id }).exec();
    if (!taggedBy) throw new NotFoundException('TaggedBy not found');
    return this.toInterface(taggedBy);
  }

  async updateTaggedBy(id: string, updateTaggedByDto: UpdateTaggedByDto, creator: any): Promise<ITaggedBy> {
    // Find the existing record
    const existing = await this.taggedByModel.findById(id);
    if (!existing) throw new NotFoundException('TaggedBy not found');
    
    // Cannot change entity type
    if (updateTaggedByDto.entityType && updateTaggedByDto.entityType !== existing.entityType) {
      throw new ConflictException('Cannot change entity type of an existing tag relation');
    }
    
    // Validate references if updating
    if (updateTaggedByDto.tagId || updateTaggedByDto.entityId) {
      const validateDto = {
        entityType: existing.entityType,
        tagId: updateTaggedByDto.tagId || existing.tagId,
        entityId: updateTaggedByDto.entityId || existing.entityId,
      } as CreateTaggedByDto;
      
      const userId = creator._id || creator.id || creator.customer?.id;
      await this.validateReferences(validateDto, userId);
    }
    
    const userId = creator._id || creator.id || creator.customer?.id;
    
    // Check for duplicates if updating
    if (updateTaggedByDto.tagId || updateTaggedByDto.entityId) {
      const duplicateFilter: any = {
        entityType: existing.entityType,
        entityId: updateTaggedByDto.entityId || existing.entityId,
        tagId: updateTaggedByDto.tagId || existing.tagId,
        creator: userId,
        _id: { $ne: id }
      };
      
      const exists = await this.taggedByModel.findOne(duplicateFilter);
      if (exists) {
        throw new ConflictException(`This tag is already assigned to this ${existing.entityType}.`);
      }
    }
    
    const updated = await this.taggedByModel.findOneAndUpdate(
      { _id: id, creator: userId },
      { ...updateTaggedByDto, updatedAt: new Date() },
      { new: true }
    ).exec();
    if (!updated) throw new NotFoundException('TaggedBy not found');
    return this.toInterface(updated);
  }

  async deleteTaggedBy(id: string, creator: UserDocument): Promise<ITaggedBy> {
    const deleted = await this.taggedByModel.findOneAndDelete({ _id: id, creator: creator._id }).lean().exec();
    if (!deleted || !deleted._id) throw new NotFoundException('TaggedBy not found');
    return this.toInterface(deleted as METaggedByDocument);
  }

  async deleteTaggedByEntityAndTag(entityType: TaggedEntityType, entityId: string, tagId: string, creator: any): Promise<ITaggedBy> {
    const userId = creator._id || creator.id || creator.customer?.id;
    const filter: any = { 
      entityType: entityType,
      entityId: entityId,
      tagId: tagId, 
      creator: userId
    };
    
    const deleted = await this.taggedByModel.findOneAndDelete(filter).lean().exec();
    if (!deleted || !deleted._id) throw new NotFoundException('TaggedBy relation not found');
    return this.toInterface(deleted as METaggedByDocument);
  }

  // Legacy method for backward compatibility
  async deleteTaggedByEmailAndTag(emailId: string, tagId: string, creator: any): Promise<ITaggedBy> {
    return this.deleteTaggedByEntityAndTag(TaggedEntityType.EMAIL, emailId, tagId, creator);
  }

  private toInterface(doc: any): ITaggedBy | null {
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      entityType: doc.entityType,
      entityId: doc.entityId?.toString(),
      tagId: doc.tagId.toString(),
      status: doc.status,
      creator: doc.creator?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
} 