/**
 * AI Image Generation Prompts
 * 
 * These prompts are used to generate product images using Gemini AI.
 * Edit these prompts to customize the image generation style and content.
 */

export interface ProductContext {
  category: string
  productName: string
  longDescription: string
  shortDescription: string
  existingImageUrl: string
}

/**
 * IMAGE 2: Alternative View of the Same Product
 * Generates a different angle/perspective of the product
 */
export function generateAlternativeViewPrompt(context: ProductContext): string {
  return `Generate a high-quality, professional product photography image showing a different angle or perspective of this product:

Product: ${context.productName}
Category: ${context.category}
Description: ${context.shortDescription}

Requirements:
- Show the product from a DIFFERENT angle than the main image (side view, top view, or 45-degree angle)
- Maintain the same lighting style, background, and aesthetic as the reference image
- Professional product photography quality
- Clean, minimal background (white or subtle gradient)
- Sharp focus on the product with proper depth of field
- Natural shadows and realistic lighting
- High resolution, suitable for e-commerce

Style: Clean, modern, professional product photography for an Indian home decor e-commerce brand. The image should match Uyarvom's premium aesthetic - elegant, traditional-meets-modern style.`
}

/**
 * IMAGE 3: Feature Highlight 1
 * Showcases a specific product feature or use case
 */
export function generateFeatureHighlight1Prompt(context: ProductContext): string {
  return `Generate a lifestyle or feature-focused product image highlighting the key features and benefits of this product:

Product: ${context.productName}
Category: ${context.category}
Description: ${context.longDescription}

Requirements:
- Show the product in a real-life context or highlight a key feature (e.g., material texture, craftsmanship detail, size comparison)
- If cookware: show it in a kitchen setting or highlight cooking surface quality
- If serveware: show it styled with food or in a dining setup
- If storage: show organizational capabilities or capacity
- Professional photography with lifestyle appeal
- Well-lit, aspirational setting
- Indian home aesthetic where appropriate
- Focus on quality, craftsmanship, or practical benefit

Style: Lifestyle product photography that tells a story. Should inspire customers and show real-world usage. Premium aesthetic matching Uyarvom's traditional-meets-modern brand identity.`
}

/**
 * IMAGE 4: Feature Highlight 2
 * Showcases another product feature, benefit, or use case
 */
export function generateFeatureHighlight2Prompt(context: ProductContext): string {
  return `Generate a detailed close-up or contextual image showing another important aspect of this product:

Product: ${context.productName}
Category: ${context.category}
Full Details: ${context.longDescription}

Requirements:
- Show a DIFFERENT feature or benefit than the previous image
- Options to highlight:
  * Material quality and texture (ceramic glaze, stainless steel finish, cast iron seasoning)
  * Craftsmanship details (hand-painted patterns, welded joints, artisan touches)
  * Functional features (handles, lids, stackability, pour spouts)
  * Size and scale (with context objects like hands, utensils, or food)
  * Versatility (multiple uses or settings)
- Professional macro or detail photography
- Clear, informative, and visually appealing
- Should answer customer questions about quality and functionality

Style: Detail-oriented product photography that builds trust. Show the quality and thoughtfulness behind Uyarvom products. Can be close-up detail shots or secondary lifestyle angles that complement the main images.`
}

/**
 * Get all prompts for a product
 */
export function getAllImagePrompts(context: ProductContext) {
  return {
    alternativeView: generateAlternativeViewPrompt(context),
    featureHighlight1: generateFeatureHighlight1Prompt(context),
    featureHighlight2: generateFeatureHighlight2Prompt(context),
  }
}

/**
 * Get prompts for specific number of images needed
 */
export function getPromptsForImageCount(context: ProductContext, existingCount: number): string[] {
  const maxImages = 4
  const needed = maxImages - existingCount
  
  if (needed <= 0) return []
  
  const allPrompts = [
    generateAlternativeViewPrompt(context),
    generateFeatureHighlight1Prompt(context),
    generateFeatureHighlight2Prompt(context),
  ]
  
  return allPrompts.slice(0, needed)
}
