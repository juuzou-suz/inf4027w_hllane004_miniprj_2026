export async function generateArtworkSummary(artwork) {
  try {
    if (!artwork) {
      return { error: 'No artwork provided' };
    }

    // Build a comprehensive, detailed prompt for Gemini
    const prompt = `You are a renowned art curator and critic with expertise in contemporary art, classical techniques, and art history. Write a comprehensive, engaging analysis of this artwork for potential collectors and art enthusiasts.

**ARTWORK INFORMATION:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: "${artwork.title || 'Untitled'}"
Artist: ${artwork.artist || 'Unknown Artist'}
Style: ${artwork.style || 'Not specified'}
Medium: ${artwork.medium || 'Not specified'}
Dimensions: ${artwork.dimensions ? `${artwork.dimensions.width} × ${artwork.dimensions.height} cm` : 'Not specified'}
Year Created: ${artwork.yearCreated || 'Not specified'}
Price: ${artwork.price ? `R${artwork.price.toLocaleString()}` : 'Contact for pricing'}

Current Description: ${artwork.description || 'No description available'}

Tags/Keywords: ${artwork.tags?.join(', ') || 'None provided'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**WRITING INSTRUCTIONS:**
Write a detailed 5-6 paragraph analysis (approximately 400-500 words total) structured as follows:

**Paragraph 1 - Visual Impact & First Impressions (100-120 words):**
Begin with a captivating opening that describes the immediate visual experience of encountering this artwork. Discuss the composition, color palette, scale, and overall aesthetic presence. What catches the eye first? How does the piece command attention? Be specific about visual elements like brushwork, color relationships, spatial dynamics, or sculptural qualities.

**Paragraph 2 - Artistic Technique & Medium (80-100 words):**
Analyze the technical execution in depth. Discuss the artist's mastery of their chosen medium. For paintings, describe brushwork, layering, texture, and application techniques. For digital art, discuss rendering quality, precision, and technical innovation. For sculpture, discuss form, material manipulation, and spatial relationships. Include specific observations about craftsmanship and skill.

**Paragraph 3 - Conceptual Depth & Meaning (80-100 words):**
Explore the thematic content and conceptual framework. What ideas, emotions, or narratives does the work convey? How does it relate to broader artistic movements or cultural contexts? Discuss symbolism, metaphor, or conceptual approaches. Connect the visual elements to deeper meanings.

**Paragraph 4 - Artistic Context & Significance (70-90 words):**
Position this work within the artist's career and contemporary art discourse. Discuss how it fits into current artistic conversations or traditions. If the artist is known for a particular style or series, explain how this piece exemplifies or extends their practice. Reference influences or innovations where relevant.

**Paragraph 5 - Collector Appeal & Placement (70-90 words):**
Address why this artwork would be valuable to collectors. Discuss its versatility in various settings, its ability to anchor a room or complement a collection. Consider emotional resonance, investment value, and aesthetic longevity. Suggest ideal contexts for display and what kind of spaces or collections would benefit from it.

**TONE & STYLE REQUIREMENTS:**
- Write with authority and expertise, but remain accessible
- Use vivid, sensory language that helps readers visualize the work
- Be specific and detailed rather than vague or generic
- Avoid clichés like "stunning masterpiece" or "don't miss out"
- Use present tense when describing the artwork
- Include sophisticated art vocabulary naturally (chiaroscuro, impasto, sfumato, etc. where appropriate)
- Balance intellectual analysis with emotional appeal
- DO NOT use marketing language, exclamation points, or urgency tactics
- DO NOT repeat the same adjectives multiple times
- DO NOT include section headers or labels in your response

Write naturally flowing paragraphs without section breaks or labels. Begin directly with the visual description.`;

    // Call Gemini API with higher token limit for detailed response
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        maxTokens: 1500  // Much higher limit for detailed summaries
      })
    });

    if (!response.ok) {
  const err = await response.json().catch(() => ({}));
  console.error('Gemini API error:', response.status, err);
  return { error: err?.error || 'Failed to generate summary' };
}

    const data = await response.json();

    // Extract the text from the route's { success, text } response shape
    const summary = data?.text;

    if (!summary) {
      return { error: 'No summary generated' };
    }

    // Clean up the response (remove any potential markdown formatting)
    const cleanedSummary = summary
      .trim()
      .replace(/\*\*/g, '')  // Remove bold markdown
      .replace(/\*/g, '')    // Remove italic markdown
      .replace(/^#+\s+/gm, ''); // Remove markdown headers

    return { 
      summary: cleanedSummary,
      success: true 
    };

  } catch (error) {
    console.error('Error generating artwork summary:', error);
    return { 
      error: 'Failed to generate summary. Please try again.' 
    };
  }
}

// Generate a shorter version for quick previews
export async function generateShortSummary(artwork) {
  try {
    if (!artwork) {
      return { error: 'No artwork provided' };
    }

    const prompt = `As an art expert, write exactly TWO engaging sentences (60-80 words total) about this artwork:

Title: "${artwork.title || 'Untitled'}"
Artist: ${artwork.artist || 'Unknown'}
Style: ${artwork.style || 'Not specified'}
Medium: ${artwork.medium || 'Not specified'}

First sentence: Describe the visual impact and aesthetic qualities.
Second sentence: Explain what makes it special or noteworthy.

Use vivid, specific language. Avoid generic phrases. Be concise and compelling.`;

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        maxTokens: 200 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      return { error: 'Failed to generate summary' };
    }

    const data = await response.json();

    // Extract the text from the route's { success, text } response shape
    const summary = data?.text;

    if (!summary) {
      return { error: 'No summary generated' };
    }

    return { 
      summary: summary.trim().replace(/\*\*/g, '').replace(/\*/g, ''),
      success: true 
    };

  } catch (error) {
    console.error('Error generating short summary:', error);
    return { 
      error: 'Failed to generate summary' 
    };
  }
}