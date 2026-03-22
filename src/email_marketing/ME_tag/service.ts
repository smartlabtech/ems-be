import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ME_tag, METagDocument } from './schema';
import { ME_group, MEGroupDocument } from '../ME_group/schema';
import { ITag } from './interface';
import { CreateTagDto } from './dto.create';
import { UpdateTagDto } from './dto.update';
import { QueryTagDto } from './dto.query';
import { UserDocument } from '../../schema';
import { ME_taggedBy, METaggedByDocument } from '../ME_taggedBy/schema';

@Injectable()
export class METagService {
  constructor(
    @InjectModel(ME_tag.name) private readonly tagModel: Model<METagDocument>,
    @InjectModel(ME_taggedBy.name) private readonly taggedByModel: Model<METaggedByDocument>,
    @InjectModel(ME_group.name) private readonly groupModel: Model<MEGroupDocument>,
  ) {}
  async createTag(createTagDto: CreateTagDto, creator: UserDocument): Promise<ITag> {
    const userId = creator._id || creator.id;
    const exists = await this.tagModel.findOne({ 
      name: createTagDto.name, 
      type: createTagDto.type,
      creator: userId 
    });
    if (exists) {
      throw new ConflictException(`A ${createTagDto.type} tag with this name already exists.`);
    }
    const created = await this.tagModel.create({
      ...createTagDto,
      creator: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.toInterface(created);
  }

  async findAllTags(query: QueryTagDto, creator: any) {
    const userId = creator._id || creator.id || creator.customer?.id;
    const filter: any = { creator: userId };
    
    // Add search functionality
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    
    // Add specific filters
    if (query.name) filter.name = { $regex: query.name, $options: 'i' };
    if (query.type) filter.type = query.type;
    
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    // Get tags
    const [tags, total] = await Promise.all([
      this.tagModel.find(filter).skip(skip).limit(size).lean().exec(),
      this.tagModel.countDocuments(filter)
    ]);

    // Get email counts for each tag
    // Note: We don't filter by creator here because we're counting how many emails
    // are tagged with each tag, regardless of who created the tag assignment
    const tagIds = tags.map(tag => tag._id);
    const [emailCounts, messageCounts] = await Promise.all([
      // Get email counts
      this.taggedByModel.aggregate([
        {
          $match: {
            tagId: { $in: tagIds },
            entityType: 'email',
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$tagId',
            count: { $sum: 1 }
          }
        }
      ]),
      // Get message counts
      this.taggedByModel.aggregate([
        {
          $match: {
            tagId: { $in: tagIds },
            entityType: 'message',
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$tagId',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Create maps for counts
    const emailCountMap = new Map();
    emailCounts.forEach(item => {
      emailCountMap.set(item._id.toString(), item.count);
    });

    const messageCountMap = new Map();
    messageCounts.forEach(item => {
      messageCountMap.set(item._id.toString(), item.count);
    });

    // Add counts to tags
    const tagsWithCounts = tags.map(tag => ({
      ...this.toInterface(tag),
      emailCount: emailCountMap.get(tag._id.toString()) || 0,
      messageCount: messageCountMap.get(tag._id.toString()) || 0
    }));

    return {
      data: tagsWithCounts,
      total,
      page,
      size,
    };
  }

  async findTagById(id: string, creator: UserDocument): Promise<ITag> {
    const tag = await this.tagModel.findOne({ _id: id, creator: creator._id }).exec();
    if (!tag) throw new NotFoundException('Tag not found');
    
    // Get email and message counts for this tag
    const [emailCount, messageCount] = await Promise.all([
      this.taggedByModel.countDocuments({
        tagId: id,
        entityType: 'email',
        status: 'active'
      }),
      this.taggedByModel.countDocuments({
        tagId: id,
        entityType: 'message',
        status: 'active'
      })
    ]);
    
    return {
      ...this.toInterface(tag),
      emailCount,
      messageCount
    };
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto, creator: UserDocument): Promise<ITag> {
    const userId = creator._id || creator.id;
    
    // First get the existing tag to know its current type
    const existingTag = await this.tagModel.findOne({ _id: id, creator: userId });
    if (!existingTag) throw new NotFoundException('Tag not found');
    
    // Check for duplicates if updating name or type
    if (updateTagDto.name || updateTagDto.type) {
      const exists = await this.tagModel.findOne({
        name: updateTagDto.name || existingTag.name,
        type: updateTagDto.type || existingTag.type,
        creator: userId,
        _id: { $ne: id }
      });
      if (exists) {
        const tagType = updateTagDto.type || existingTag.type;
        throw new ConflictException(`A ${tagType} tag with this name already exists.`);
      }
    }
    
    const updated = await this.tagModel.findOneAndUpdate(
      { _id: id, creator: userId },
      { ...updateTagDto, updatedAt: new Date() },
      { new: true }
    ).exec();
    if (!updated) throw new NotFoundException('Tag not found');
    return this.toInterface(updated);
  }

  async deleteTag(id: string, creator: UserDocument): Promise<ITag> {
    // Check if tag is assigned to any emails or messages
    const tagAssignments = await this.taggedByModel.countDocuments({ tagId: id });
    if (tagAssignments > 0) {
      throw new ConflictException(`Cannot delete tag. It is assigned to ${tagAssignments} item(s). Please remove the tag from all emails and messages first.`);
    }

    // Remove the tag from all groups that have it
    const userId = creator._id || creator.id;
    const updateResult = await this.groupModel.updateMany(
      { 
        creator: userId,
        tags: id 
      },
      { 
        $pull: { tags: id },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log(`Removed tag ${id} from ${updateResult.modifiedCount} groups`);

    const deleted = await this.tagModel.findOneAndDelete({ _id: id, creator: userId }).lean().exec();
    if (!deleted || !deleted._id) throw new NotFoundException('Tag not found');
    return this.toInterface(deleted as METagDocument);
  }

  async getGroupsContainingTag(tagId: string, creator: UserDocument): Promise<{ groups: string[], count: number }> {
    const userId = creator._id || creator.id;
    const groups = await this.groupModel.find(
      { 
        creator: userId,
        tags: tagId 
      },
      { name: 1 }
    ).lean().exec();
    
    return {
      groups: groups.map(g => g.name),
      count: groups.length
    };
  }

  private toInterface(doc: any): ITag | null {
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      status: doc.status,
      creator: doc.creator?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
} 