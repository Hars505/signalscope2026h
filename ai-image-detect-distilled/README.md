---
license: mit
tags:
- image-classification
- pytorch
- ViT
- transformers
- real-fake-detection
- deep-fake
- ai-detect
- ai-image-detection
metrics:
- accuracy
model-index:
- name: AI Image Detect Distilled
  results:
  - task:
      type: image-classification
      name: Image Classification
    metrics:
    - type: accuracy
      value: 0.74
pipeline_tag: image-classification
library_name: transformers
---
# AI Detection Model

## Model Architecture and Training

Three separate models were initially trained:
1. Midjourney vs. Real Images
2. Stable Diffusion vs. Real Images
3. Stable Diffusion Fine-tunings vs. Real Images

Data preparation process:
- Used Google's Open Image Dataset for real images
- Described real images using BLIP (Bootstrapping Language-Image Pre-training)
- Generated Stable Diffusion images using BLIP descriptions
- Found similar Midjourney images based on BLIP descriptions

This approach ensured real and AI-generated images were as similar as possible, differing only in their origin.

The three models were then distilled into a small ViT model with 11.8 Million Parameters, combining their learned features for more efficient detection.

## Data Sources

- Google's Open Image Dataset: [link](https://storage.googleapis.com/openimages/web/index.html)
- Ivan Sivkov's Midjourney Dataset: [link](https://www.kaggle.com/datasets/ivansivkovenin/midjourney-prompts-image-part8)
- TANREI(NAMA)'s Stable Diffusion Prompts Dataset: [link](https://www.kaggle.com/datasets/tanreinama/900k-diffusion-prompts-dataset)

## Performance

- Validation Set: 74% accuracy
  - Held out from training data to assess generalization

- Custom Real-World Set: 72% accuracy
  - Composed of self-captured images and online-sourced images
  - Designed to be more representative of internet-based images

- Comparative Analysis:
  - Outperformed other popular AI detection models by 5 percentage points on both sets
  - Other models achieved 89% and 79% on validation and real-world sets respectively

## Key Insights

1. Strong generalization on validation data (75% accuracy)
2. Good adaptability to diverse, real-world images (72% accuracy)
3. Consistent outperformance of other popular models
4. 10-point accuracy drop from validation to real-world set indicates room for improvement
5. Comprehensive training on multiple AI generation techniques contributes to model versatility
6. Focus on subtle differences in image generation rather than content disparities

## Future Directions

- Expand dataset with more diverse, real-world examples to bridge the performance gap
- Improve generalization to internet-sourced images
- Conduct error analysis on misclassified samples to identify patterns
- Integrate new AI image generation techniques as they emerge
- Consider fine-tuning for specific domains where detection accuracy is critical