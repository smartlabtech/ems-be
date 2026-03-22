import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { ME_email, MEEmailDocument } from './schema';
import { IEmail } from './interface';
import { CreateEmailDto } from './dto.create';
import { UpdateEmailDto } from './dto.update';
import { QueryEmailDto } from './dto.query';
import { UserDocument } from '../../schema';
import { ME_taggedBy, METaggedByDocument } from '../ME_taggedBy/schema';
import { ME_tag, METagDocument } from '../ME_tag/schema';
import { TaggedEntityType } from '../ME_taggedBy/enum';
import { TagType } from '../ME_tag/enum';
import { EmailSource } from './enum';

@Injectable()
export class MEEmailService {
  constructor(
    @InjectModel(ME_email.name) private readonly emailModel: Model<MEEmailDocument>,
    @InjectModel(ME_taggedBy.name) private readonly taggedByModel: Model<METaggedByDocument>,
    @InjectModel(ME_tag.name) private readonly tagModel: Model<METagDocument>,
  ) {}

  async createEmail(createEmailDto: CreateEmailDto, creator: any): Promise<IEmail> {
    const userId = creator._id || creator.id || creator.customer?.id;
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    
    // Extract tags from DTO
    const { tags, ...emailData } = createEmailDto;
    
    // Handle tags - support both array and comma-separated string formats
    let tagsArray: string[] = [];
    if (tags && tags !== "" && tags !== null) {
      if (Array.isArray(tags)) {
        // If it's already an array, use it directly
        tagsArray = tags.filter(tag => tag && tag.trim());
      } else if (typeof tags === 'string') {
        // If it's a string, split by comma
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }
    
    // Check if email exists
    const existingEmail = await this.emailModel.findOne({ 
      email: createEmailDto.email, 
      creator: userObjectId 
    });
    
    if (existingEmail) {
      // Update existing email
      const updated = await this.emailModel.findOneAndUpdate(
        { _id: existingEmail._id, creator: userObjectId },
        { ...emailData, updatedAt: new Date() },
        { new: true }
      ).lean().exec();
      
      // Handle tags if provided (add new tags without removing existing ones)
      if (tagsArray && tagsArray.length > 0) {
        await this.handleTags(existingEmail._id.toString(), tagsArray, userId, TaggedEntityType.EMAIL);
      }
      
      // Return updated email with tags
      return this.findEmailById(existingEmail._id.toString(), creator);
    } else {
      // Create new email
      const created = await this.emailModel.create({
        ...emailData,
        creator: userObjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Handle tags if provided
      if (tagsArray && tagsArray.length > 0) {
        await this.handleTags(created._id.toString(), tagsArray, userId, TaggedEntityType.EMAIL);
      }
      
      // Return created email with tags
      return this.findEmailById(created._id.toString(), creator);
    }
  }


  // New helper method to handle tag creation and assignment
  private async handleTags(entityId: string, tagNames: string[], userId: any, entityType: TaggedEntityType): Promise<void> {
    for (const tagName of tagNames) {
      if (!tagName || tagName.trim() === '') continue;
      
      // Check if tag exists for this user and type
      let tag = await this.tagModel.findOne({
        name: tagName.trim(),
        type: entityType === TaggedEntityType.EMAIL ? 'email' : 'message',
        creator: userId
      });
      
      // Create tag if it doesn't exist
      if (!tag) {
        tag = await this.tagModel.create({
          name: tagName.trim(),
          type: entityType === TaggedEntityType.EMAIL ? 'email' : 'message',
          creator: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // Check if taggedBy relation already exists
      const existingTaggedBy = await this.taggedByModel.findOne({
        entityType,
        entityId,
        tagId: tag._id,
        creator: userId
      });
      
      // Create taggedBy relation if it doesn't exist
      if (!existingTaggedBy) {
        await this.taggedByModel.create({
          entityType,
          entityId,
          tagId: tag._id,
          creator: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  async findAllEmails(query: QueryEmailDto, creator: any) {
    try {
      const userId = creator._id || creator.id || creator.customer?.id;
      
      if (!userId) {
        throw new Error('User ID not found in creator object');
      }

      // Convert userId to ObjectId if it's a string
      const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      const filter: any = { creator: userObjectId };
      
      // Add search functionality
      if (query.search) {
        filter.$or = [
          { email: { $regex: query.search, $options: 'i' } },
          { firstName: { $regex: query.search, $options: 'i' } },
          { lastName: { $regex: query.search, $options: 'i' } },
          { mobile: { $regex: query.search, $options: 'i' } },
          { whatsapp: { $regex: query.search, $options: 'i' } },
        ];
      }
      
      // Add specific filters
      if (query.email) filter.email = { $regex: query.email, $options: 'i' };
      if (query.mobile) filter.mobile = { $regex: query.mobile, $options: 'i' };
      if (query.whatsapp) filter.whatsapp = { $regex: query.whatsapp, $options: 'i' };
      if (query.source) filter.source = query.source;

      // Handle tag filtering
      if (query.tagIds) {
        const tagIdArray = query.tagIds.split(',').map(id => new mongoose.Types.ObjectId(id.trim()));
        
        if (tagIdArray.length > 0) {
          const taggedByRecords = await this.taggedByModel.find({
            tagId: { $in: tagIdArray },
            entityType: TaggedEntityType.EMAIL,
            creator: userObjectId,
            status: 'active'
          }).distinct('entityId');

          // Add email ID filter to the main filter
          if (taggedByRecords.length > 0) {
            filter._id = { $in: taggedByRecords };
          } else {
            // No emails have the specified tags, return empty result
            return {
              data: [],
              total: 0,
              page: query.page ?? 1,
              size: query.size ?? 20,
            };
          }
        }
      }
      
      // Check if this is an export request (handle both boolean and string values)
      const isExport = query.export === true || (query.export as any) === 'true';

      let page: number;
      let size: number;
      let skip: number;

      if (isExport) {
        // For export, ignore pagination
        page = 1;
        size = 0; // Will be set to total count
        skip = 0;
      } else {
        // For regular requests, use pagination
        page = query.page ?? 1;
        size = query.size ?? 20;
        skip = (page - 1) * size;
      }

      console.log('Email query filter:', JSON.stringify(filter));
      console.log('User ID:', userId);
      console.log('Is Export:', isExport);

      try {
        // Get total count
        const total = await this.emailModel.countDocuments(filter);

        // For export, use configurable limit and offset
        const maxExportLimit = 10000; // Hard limit to prevent memory issues
        const exportLimit = isExport
          ? Math.min(Number(query.exportLimit) || maxExportLimit, maxExportLimit)
          : 0;
        const exportOffset = isExport ? (Number(query.exportOffset) || 0) : 0;

        if (isExport) {
          console.log(`Export mode: offset=${exportOffset}, limit=${exportLimit}, total=${total}`);
          if (total > exportLimit) {
            console.warn(`Large export: ${total} total records, returning batch from ${exportOffset} to ${exportOffset + exportLimit}`);
          }
        }

        // Build aggregation pipeline for efficient querying
        const pipeline: any[] = [
          { $match: filter },
          { $sort: { createdAt: -1 } }, // Sort by creation date
        ];

        // Add pagination/limit
        if (!isExport) {
          pipeline.push({ $skip: skip });
          pipeline.push({ $limit: size });
        } else {
          // For export, use offset and limit
          if (exportOffset > 0) {
            pipeline.push({ $skip: exportOffset });
          }
          pipeline.push({ $limit: exportLimit });
        }

        // Lookup tags using aggregation (more efficient than N+1 queries)
        pipeline.push(
          {
            $lookup: {
              from: 'me_tagged_by',
              let: { emailId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$entityType', TaggedEntityType.EMAIL] },
                        { $eq: ['$entityId', '$$emailId'] },
                        { $eq: ['$creator', userObjectId] },
                        { $eq: ['$status', 'active'] }
                      ]
                    }
                  }
                }
              ],
              as: 'taggedBy'
            }
          },
          {
            $lookup: {
              from: 'me_tag',
              let: { tagIds: '$taggedBy.tagId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $in: ['$_id', '$$tagIds'] },
                        { $eq: ['$creator', userObjectId] },
                        { $eq: ['$status', 'active'] }
                      ]
                    }
                  }
                }
              ],
              as: 'tags'
            }
          },
          {
            $addFields: {
              tags: {
                $map: {
                  input: '$tags',
                  as: 'tag',
                  in: {
                    id: { $toString: '$$tag._id' },
                    name: '$$tag.name',
                    status: '$$tag.status'
                  }
                }
              }
            }
          },
          {
            $project: {
              taggedBy: 0 // Remove intermediate field
            }
          }
        );

        // Execute aggregation
        const emails = await this.emailModel.aggregate(pipeline).exec();

        // Transform results
        const emailsWithTags = emails.map(email => this.toInterface(email));

        return {
          data: emailsWithTags,
          total,
          page: isExport ? Math.floor(exportOffset / exportLimit) + 1 : page,
          size: isExport ? emailsWithTags.length : size,
          ...(isExport && {
            exportInfo: {
              offset: exportOffset,
              limit: exportLimit,
              returned: emailsWithTags.length,
              hasMore: exportOffset + emailsWithTags.length < total,
              nextOffset: exportOffset + exportLimit < total ? exportOffset + exportLimit : null,
            }
          })
        };
      } catch (error) {
        console.error('Error in findAllEmails:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in findAllEmails:', error);
      throw error;
    }
  }

  async findEmailById(id: string, creator: any): Promise<IEmail> {
    const userId = creator._id || creator.id || creator.customer?.id;
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    
    try {
      // Simplified aggregation to include tags for single email
      const pipeline = [
        { 
          $match: { 
            _id: new mongoose.Types.ObjectId(id), 
            creator: userObjectId 
          } 
        },
        {
          $lookup: {
            from: 'me_tagged_by',
            let: { emailId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$entityType', TaggedEntityType.EMAIL] },
                      { $eq: ['$entityId', '$$emailId'] }
                    ]
                  }
                }
              }
            ],
            as: 'taggedBy'
          }
        },
        {
          $addFields: {
            taggedByFiltered: {
              $filter: {
                input: '$taggedBy',
                as: 'tb',
                cond: {
                  $and: [
                    { $eq: [{ $toString: '$$tb.creator' }, { $toString: userObjectId }] },
                    { $eq: ['$$tb.status', 'active'] }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'me_tag',
            let: { tagIds: '$taggedByFiltered.tagId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$_id', '$$tagIds'] },
                      { $eq: [{ $toString: '$creator' }, { $toString: userObjectId }] },
                      { $eq: ['$status', 'active'] }
                    ]
                  }
                }
              }
            ],
            as: 'tags'
          }
        },
        {
          $addFields: {
            tags: {
              $map: {
                input: '$tags',
                as: 'tag',
                in: {
                  id: { $toString: '$$tag._id' },
                  name: '$$tag.name',
                  status: '$$tag.status'
                }
              }
            }
          }
        }
      ];

      const result = await this.emailModel.aggregate(pipeline);
      
      if (!result || result.length === 0) {
        throw new NotFoundException('Email not found');
      }
      
      return this.toInterface(result[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Fallback to simple query without tags
      console.warn('Aggregation failed for single email, falling back to simple query:', error.message);
      const email = await this.emailModel.findOne({ _id: id, creator: userObjectId }).exec();
      if (!email) throw new NotFoundException('Email not found');
      return this.toInterface({ ...email.toObject(), tags: [] });
    }
  }

  async updateEmail(id: string, updateEmailDto: UpdateEmailDto, creator: any): Promise<IEmail> {
    const userId = creator._id || creator.id || creator.customer?.id;
    
    // Check for duplicate email if updating email address
    if (updateEmailDto.email) {
      const exists = await this.emailModel.findOne({
        email: updateEmailDto.email,
        creator: userId,
        _id: { $ne: id }
      });
      if (exists) {
        throw new ConflictException('An email with this address already exists.');
      }
    }
    
    // Extract tags from DTO
    const { tags, ...emailData } = updateEmailDto;
    
    // Handle tags - support both array and comma-separated string formats
    let tagsArray: string[] | undefined;
    if (tags !== undefined) {
      if (tags === null || tags === "" || (Array.isArray(tags) && tags.length === 0)) {
        // Empty tags means clear all tags
        tagsArray = [];
      } else if (Array.isArray(tags)) {
        // If it's already an array, use it directly
        tagsArray = tags.filter(tag => tag && tag.trim());
      } else if (typeof tags === 'string') {
        // If it's a string, split by comma
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }
    
    const updated = await this.emailModel.findOneAndUpdate(
      { _id: id, creator: userId },
      { ...emailData, updatedAt: new Date() },
      { new: true }
    ).lean().exec();
    
    if (!updated) throw new NotFoundException('Email not found');
    
    // Handle tags if provided (replace existing tags)
    if (tagsArray !== undefined) {
      // Remove all existing tags for this email
      await this.taggedByModel.deleteMany({
        entityType: TaggedEntityType.EMAIL,
        entityId: id,
        creator: userId
      });
      
      // Add new tags if any
      if (tagsArray && tagsArray.length > 0) {
        await this.handleTags(id, tagsArray, userId, TaggedEntityType.EMAIL);
      }
    }
    
    // Return email with tags
    return this.findEmailById(id, creator);
  }

  async deleteEmail(id: string, creator: any): Promise<IEmail> {
    const userId = creator._id || creator.id || creator.customer?.id;
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    
    // First find the email to ensure it exists and belongs to the user
    const email = await this.emailModel.findOne({ _id: id, creator: userObjectId }).lean().exec();
    if (!email) throw new NotFoundException('Email not found');
    
    // Delete all taggedBy records associated with this email
    await this.taggedByModel.deleteMany({ 
      entityType: TaggedEntityType.EMAIL,
      entityId: new mongoose.Types.ObjectId(id),
      creator: userObjectId 
    });
    
    // Now delete the email
    const deleted = await this.emailModel.findOneAndDelete({ _id: id, creator: userObjectId }).lean().exec();
    
    return this.toInterface(deleted as MEEmailDocument);
  }

  private toInterface(doc: any): IEmail | null {
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      mobile: doc.mobile,
      whatsapp: doc.whatsapp,
      status: doc.status,
      source: doc.source,
      creator: doc.creator?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      tags: doc.tags || [],
    };
  }
} 