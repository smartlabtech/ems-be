import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ME_group, MEGroupDocument } from './schema';
import { ME_tag, METagDocument } from '../ME_tag/schema';
import { IGroup } from './interface';
import { CreateGroupDto } from './dto.create';
import { UpdateGroupDto } from './dto.update';
import { QueryGroupDto } from './dto.query';
import { UserDocument } from '../../schema';

@Injectable()
export class MEGroupService {
  constructor(
    @InjectModel(ME_group.name) private readonly groupModel: Model<MEGroupDocument>,
    @InjectModel(ME_tag.name) private readonly tagModel: Model<METagDocument>,
  ) {}

  async createGroup(createGroupDto: CreateGroupDto, creator: any): Promise<IGroup> {
    try {
      const userId = creator._id || creator.id || creator.customer?.id;
      console.log('Creating group with data:', createGroupDto);
      console.log('Creator ID:', userId);
      
      const exists = await this.groupModel.findOne({ name: createGroupDto.name, creator: userId });
      if (exists) {
        throw new ConflictException('A group with this name already exists.');
      }
      
      // Validate tags if provided
      if (createGroupDto.tags && createGroupDto.tags.length > 0) {
        console.log('Validating tags:', createGroupDto.tags);
        const validTags = await this.tagModel.find({
          _id: { $in: createGroupDto.tags },
          creator: userId
        });
        
        if (validTags.length !== createGroupDto.tags.length) {
          const validTagIds = validTags.map(tag => tag._id.toString());
          const invalidTags = createGroupDto.tags.filter(tagId => !validTagIds.includes(tagId));
          throw new BadRequestException(`Invalid or unauthorized tag IDs: ${invalidTags.join(', ')}`);
        }
        console.log('All tags are valid');
      }
      
      const groupData = {
        ...createGroupDto,
        creator: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Group data to create:', groupData);
      
      const created = await this.groupModel.create(groupData);
      console.log('Group created successfully:', created);
      
      return this.toInterface(created);
    } catch (error) {
      console.error('Error creating group:', error);
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  async findAllGroups(query: QueryGroupDto, creator: any) {
    const userId = creator._id || creator.id || creator.customer?.id;
    const filter: any = { creator: userId };
    
    // Add search functionality
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }
    
    // Add specific filters
    if (query.name) filter.name = { $regex: query.name, $options: 'i' };
    if (query.tagId) filter.tags = query.tagId;
    if (query.tags) {
      const tagIds = query.tags.split(',').map(id => id.trim());
      filter.tags = { $in: tagIds };
    }
    
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const skip = (page - 1) * size;

    const [groups, total] = await Promise.all([
      this.groupModel.find(filter).skip(skip).limit(size).exec(),
      this.groupModel.countDocuments(filter)
    ]);

    return {
      data: groups.map(g => this.toInterface(g)),
      total,
      page,
      size,
    };
  }

  async findGroupById(id: string, creator: UserDocument): Promise<IGroup> {
    const group = await this.groupModel.findOne({ _id: id, creator: creator._id }).exec();
    if (!group) throw new NotFoundException('Group not found');
    return this.toInterface(group);
  }

  async updateGroup(id: string, updateGroupDto: UpdateGroupDto, creator: any): Promise<IGroup> {
    const userId = creator._id || creator.id || creator.customer?.id;
    if (updateGroupDto.name) {
      const exists = await this.groupModel.findOne({
        name: updateGroupDto.name,
        creator: userId,
        _id: { $ne: id }
      });
      if (exists) {
        throw new ConflictException('A group with this name already exists.');
      }
    }
    const updated = await this.groupModel.findOneAndUpdate(
      { _id: id, creator: userId },
      { ...updateGroupDto, updatedAt: new Date() },
      { new: true }
    ).exec();
    if (!updated) throw new NotFoundException('Group not found');
    return this.toInterface(updated);
  }

  async deleteGroup(id: string, creator: UserDocument): Promise<IGroup> {
    const deleted = await this.groupModel.findOneAndDelete({ _id: id, creator: creator._id }).lean().exec();
    if (!deleted || !deleted._id) throw new NotFoundException('Group not found');
    return this.toInterface(deleted as MEGroupDocument);
  }

  private toInterface(doc: any): IGroup | null {
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      tags: (doc.tags || []).map((tag: any) => tag.toString()),
      status: doc.status,
      creator: doc.creator?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
} 