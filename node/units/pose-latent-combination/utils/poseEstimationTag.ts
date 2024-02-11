import redisClient from '../../../shared/redis/client';

// Define cache keys
const poseEstimationCacheKey = 'pose_estimation_cache';
const segmentationMaskCacheKey = 'segmentation_mask_cache';

export default async function processPoseEstimationTag (request: any): Promise<void | Object> {
  try {
    const { videoUUID, frameNumber, instanceID, poseEstimationTag } = request;
    const cacheKey = `${videoUUID}:${frameNumber}:${instanceID}`;
    
    // Check if the key exists in the segmentation binary mask cache
    const segmentationMaskExists = await redisClient.exists(segmentationMaskCacheKey);
    
    if (!segmentationMaskExists) {
      // Store pose estimation tag in cache if segmentation binary mask doesn't exist
      await redisClient.hSet(poseEstimationCacheKey, cacheKey, poseEstimationTag);
      return;
    } else {
      // Combine pose estimation tag and segmentation binary mask for instance synthesis request
      const segmentationMask = await redisClient.hGet(segmentationMaskCacheKey, cacheKey);
      const instanceSynthesisRequest = {
        uuid: videoUUID,
        frameNumber: frameNumber,
        instanceId: instanceID,
        poseEstimationTag: poseEstimationTag,
        segmentationMask: segmentationMask
      };
      // Put instance synthesis request into the "Instance replacement request queue"
      return instanceSynthesisRequest;
    }
  } catch (error) {
    console.error('Error processing pose estimation tag request:', error);
  }
};