import { supabase } from '@/integrations/supabase/client';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Prompt for Summarization (remains the same as last accepted by user)
const summarizationPromptTemplate = `Please provide a comprehensive and well-structured summary of the following text. 
Your goal is to rephrase and synthesize the information, ensuring that all significant points, arguments, concepts, and supporting details are covered accurately.
Summarize the core information and main points of the text directly, as if you are explaining it to someone who has not read the original document. Avoid meta-commentary about the document itself (e.g., do not say 'This document outlines...' or 'The text discusses...'). Instead, directly present the information.

Organize your response exactly as follows, using markdown for formatting:

### Overview
Provide a concise, high-level summary of the entire text (2-4 sentences) that captures its main purpose and scope. Present this as a direct summary of the content.

### Key Concepts & Details
Identify and elaborate on all core concepts, methodologies, and significant points discussed in the text. For each item:
- Present it as: **Identified Term/Concept:** Followed by a detailed explanation of that term/concept.
- If the explanation involves a list of principles, practices, steps, or sub-details, use markdown bullet points ('-') under the respective bolded term.
- Ensure your explanations are thorough and rephrased in your own words where possible, while maintaining accuracy to the source text.

### Main Takeaways
List 3-5 distinct and insightful conclusions or critical implications derived from the text. 
These should be synthesized statements that represent the most crucial understandings a reader should gain. Present each takeaway as a markdown bullet point ('-').

Here is the text:

PLACEHOLDER_FOR_CONTENT`;


// Refined prompt template for Auto-Tagging and Linking
const autoTaggingPromptTemplate = `
Analyze the following note content AND its AI-generated summary (if provided). Based on this analysis, provide:
1. A list of 3-5 (but at least 3 if possible) general and relevant topic tags. Prefer broader topic tags over extremely niche ones unless the niche is central to the document. These tags should be specific enough to be useful but general enough to categorize the note effectively. (Examples of GOOD general tags: 'Software Engineering', 'Physics', 'Economics'. Examples of BAD overly specific tags to AVOID unless they are the *absolute central theme*: 'Sprint Planning Details', 'Quantum Entanglement Research').
2. A list of 2-3 keywords extracted directly from the AI-generated summary of the note. These keywords should be important terms found *within the summary text*.
3. A list of suggested links to other notes that are semantically related to this note's content (aim for 1-2 highly relevant links if any).

Note Content to Analyze:
\`\`\`
{{NOTE_CONTENT}}
\`\`\`

AI-Generated Summary of the Note (use this to extract summary_keywords):
\`\`\`
{{AI_SUMMARY_CONTENT}}
\`\`\`

Existing Tags for this Note (for context, avoid suggesting these exact tags again for the general topic tags):
{{EXISTING_TAGS}}

List of All Other Available Note Titles and their IDs (for link suggestions):
{{ALL_NOTE_TITLES_AND_IDS}}

Please format your response as a single JSON object with the following exact structure:
{
  "suggested_tags": [
    {"name": "string (general categorical tag name)", "category": "string (e.g., Broad Subject, Main Field)"}
    // ... (aim for 3-5 tags, minimum 3 if possible)
  ],
  "summary_keywords": [
    "string (keyword from summary)",
    "string (another keyword from summary)"
    // ... (2-3 keywords from the summary text)
  ],
  "suggested_links": [
    {
      "note_id": "string (ID of the related note)",
      "note_title": "string (Title of the related note)",
      "reason": "string (brief explanation for the link suggestion)"
    }
    // ... (1-2 links maximum)
  ]
}

If no relevant items are found for any field, return an empty array for that field (e.g., "summary_keywords": []).
`;

const flashcardPromptTemplate = `
Based on the provided AI-generated summary text, please extract key information and transform it into a series of concise and informative flashcards. 
Each flashcard should represent an important concept, definition, or key fact suitable for learning and review.

Format your response as a JSON object containing an array called "flashcards". Each object in the array should have two properties: "front" (for the question, term, or prompt) and "back" (for the concise answer or detailed definition/explanation).

- Aim for 8-15 high-quality flashcards. If the summary is very rich, more is acceptable, but prioritize clarity and importance.
- For the "front": Use a clear question (e.g., "What are the core values of the Agile Manifesto?") or a key term/phrase (e.g., "Extreme Programming (XP):").
- For the "back": Provide a direct, accurate, and sufficiently detailed answer or explanation. Avoid overly terse or overly verbose answers. It should be a complete thought or definition.
- Ensure the information is directly and accurately derived from the provided summary text.
- Prioritize the most significant concepts, principles, and factual details from the summary.

AI Summary Text to Process:
\`\`\`
{{AI_SUMMARY_CONTENT}}
\`\`\`

Example JSON Output Structure:
{
  "flashcards": [
    { "front": "What are the four core values of the Agile Manifesto?", "back": "Individuals and interactions over processes and tools; Working software over comprehensive documentation; Customer collaboration over contract negotiation; Responding to change over following a plan." },
    { "front": "Extreme Programming (XP) - Key Idea:", "back": "An agile method that takes an 'extreme' approach to iterative development, including frequent builds, short release cycles, and continuous testing." },
    { "front": "Define: Product Backlog (Scrum)", "back": "A prioritized list of \'to do\' items which the Scrum team must tackle, including feature definitions, software requirements, or user stories." }
  ]
}

If the summary is too short or no distinct, meaningful flashcard points can be extracted, return an empty "flashcards" array.
`;

export interface FlashcardData {
  front: string;
  back: string;
}

// Renamed processNoteWithGemini to processNoteSummaryWithGemini for clarity
export async function processNoteSummaryWithGemini(noteId: string, content: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not set in the environment variables.');
  }
  if (!content || content.trim().length === 0) {
    throw new Error('Note content is empty or too short to process.');
  }

  const promptWithContent = summarizationPromptTemplate.replace('PLACEHOLDER_FOR_CONTENT', content);
  const geminiResponse = await callGemini(promptWithContent);

  let parsedAISummary = "Overview could not be extracted.";
  let parsedAIKeyPoints: string[] = ["Key Concepts & Details or Main Takeaways could not be extracted."];

  try {
    const overviewMarker = "### Overview";
    const conceptsDetailsMarker = "### Key Concepts & Details"; 
    const takeawaysMarker = "### Main Takeaways";

    let responseRemainder = geminiResponse;
    const overviewIndex = responseRemainder.indexOf(overviewMarker);
    if (overviewIndex !== -1) {
      const conceptsIndexTemp = responseRemainder.indexOf(conceptsDetailsMarker, overviewIndex + overviewMarker.length);
      const takeawaysIndexTemp = responseRemainder.indexOf(takeawaysMarker, overviewIndex + overviewMarker.length);
      let endOfOverview = -1;
      if (conceptsIndexTemp !== -1 && takeawaysIndexTemp !== -1) {
        endOfOverview = Math.min(conceptsIndexTemp, takeawaysIndexTemp);
      } else if (conceptsIndexTemp !== -1) {
        endOfOverview = conceptsIndexTemp;
      } else if (takeawaysIndexTemp !== -1) {
        endOfOverview = takeawaysIndexTemp;
      } else {
        endOfOverview = responseRemainder.length; 
      }
      parsedAISummary = responseRemainder.substring(overviewIndex + overviewMarker.length, endOfOverview).trim();
      responseRemainder = responseRemainder.substring(endOfOverview);
    } else {
      const sentences = geminiResponse.match(/[^.!?]+[.!?]+/g);
      if (sentences) {
        parsedAISummary = sentences.slice(0, 3).join(' ').trim();
        if (!parsedAISummary) {
            const firstParaEnd = geminiResponse.indexOf('\n\n');
            if (firstParaEnd !== -1) {
                parsedAISummary = geminiResponse.substring(0, firstParaEnd).trim();
            }
        }
      }
      if(!parsedAISummary) parsedAISummary = "Overview could not be reliably extracted.";
    }

    let conceptsContent = "";
    let takeawaysContent = "";
    const conceptsIndex = responseRemainder.indexOf(conceptsDetailsMarker);
    const takeawaysIndexForConcepts = responseRemainder.indexOf(takeawaysMarker, conceptsIndex + (conceptsIndex !== -1 ? conceptsDetailsMarker.length : 0));

    if (conceptsIndex !== -1) {
      const endOfConcepts = takeawaysIndexForConcepts !== -1 ? takeawaysIndexForConcepts : responseRemainder.length;
      conceptsContent = responseRemainder.substring(conceptsIndex, endOfConcepts).trim(); 
    }

    const takeawaysIndexFinal = responseRemainder.indexOf(takeawaysMarker);
    if (takeawaysIndexFinal !== -1) {
      takeawaysContent = responseRemainder.substring(takeawaysIndexFinal).trim();
    }
    
    let combinedDetails = "";
    if (conceptsContent) {
        combinedDetails += conceptsContent + "\n\n";
    }
    if (takeawaysContent) {
        combinedDetails += takeawaysContent;
    }

    if (combinedDetails.trim()) {
      parsedAIKeyPoints = combinedDetails.trim().split('\n');
    } else if (parsedAISummary !== geminiResponse.trim() && responseRemainder.trim()) {
      parsedAIKeyPoints = responseRemainder.trim().split('\n');
    } else if (!parsedAISummary && !combinedDetails.trim()){
        parsedAIKeyPoints = geminiResponse.trim().split('\n');
        parsedAISummary = "Could not reliably segment AI response.";
    }

  } catch (e) {
    console.error("Error parsing Gemini response in processNoteSummaryWithGemini:", e);
    parsedAIKeyPoints = [`Error encountered while parsing AI response: ${(e as Error).message}`];
  }
  
  if (parsedAIKeyPoints.length === 1 && parsedAIKeyPoints[0].includes("could not be extracted") && parsedAISummary && !parsedAISummary.includes("could not be extracted")) {
      if (geminiResponse.trim() !== parsedAISummary.trim()) { 
         parsedAIKeyPoints = geminiResponse.trim().split('\n');
      }
  }
  
  // Update note in Supabase - This was part of the original processNoteWithGemini, 
  // but summarization results should be updated separately or passed back to aiService to handle DB update.
  // For now, just returning the parsed parts.
  // const { error } = await supabase.from('notes').update({ ai_summary: parsedAISummary, ai_key_points: parsedAIKeyPoints, ai_processed: true }).eq('id', noteId);
  // if (error) { throw new Error('Failed to update note with AI summary results: ' + error.message); }

  return { summary: parsedAISummary, keyPoints: parsedAIKeyPoints };
}

export async function generateTagsAndLinks(
  noteContent: string, 
  aiSummaryContent: string,
  existingTags: string[],
  allNoteTitlesAndIds: { id: string; title: string }[]
) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key is not set.');
  if (!noteContent) {
    console.warn('Note content is empty for auto-tagging/linking.');
    return null;
  }

  let prompt = autoTaggingPromptTemplate.replace('{{NOTE_CONTENT}}', noteContent);
  prompt = prompt.replace('{{AI_SUMMARY_CONTENT}}', aiSummaryContent || 'Not available');
  prompt = prompt.replace('{{EXISTING_TAGS}}', existingTags.join(', ') || 'None');
  const titlesAndIdsString = allNoteTitlesAndIds.map(n => `- ${n.title} (ID: ${n.id})`).join('\n');
  prompt = prompt.replace('{{ALL_NOTE_TITLES_AND_IDS}}', titlesAndIdsString || 'None available');

  // console.log("Auto-tagging prompt being sent:", prompt); // Remove for production

  try {
    const rawResponse = await callGemini(prompt);
    // console.log("Raw AI response for tags/links:", rawResponse); // Remove for production

    const firstBrace = rawResponse.indexOf('{');
    const lastBrace = rawResponse.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        console.error("AI response for tags/links/keywords does not appear to be valid JSON object.", rawResponse);
        return null;
    }
    const jsonString = rawResponse.substring(firstBrace, lastBrace + 1);
    const parsedResponse = JSON.parse(jsonString);
    
    if (!parsedResponse.suggested_tags || !parsedResponse.suggested_links || !parsedResponse.summary_keywords) {
        console.error("Parsed AI response for tags/links/keywords is missing expected fields.", parsedResponse);
        return null;
    }
    
    // console.log("Parsed AI suggestions for tags/links:", parsedResponse); // Remove for production
    return parsedResponse; 

  } catch (error) {
    console.error("Error generating or parsing tags/links/keywords from AI:", error);
    return null;
  }
}

export async function generateFlashcardsFromSummary(aiSummaryText: string): Promise<FlashcardData[] | null> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key is not set.');
  if (!aiSummaryText || aiSummaryText.trim().length < 50) { // Require a minimum summary length
    console.warn('AI Summary text is too short for flashcard generation.');
    return []; // Return empty array if not enough content
  }

  const prompt = flashcardPromptTemplate.replace('{{AI_SUMMARY_CONTENT}}', aiSummaryText);

  try {
    const rawResponse = await callGemini(prompt);
    const firstBrace = rawResponse.indexOf('{');
    const lastBrace = rawResponse.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      console.error("AI response for flashcards does not appear to be a valid JSON object.", rawResponse);
      return null;
    }
    const jsonString = rawResponse.substring(firstBrace, lastBrace + 1);
    const parsedResponse = JSON.parse(jsonString);
    
    if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
      console.error("Parsed AI response for flashcards is missing or has an invalid 'flashcards' field.", parsedResponse);
      return null;
    }
    // Further validation for each flashcard object can be added here if needed
    return parsedResponse.flashcards as FlashcardData[];
  } catch (error) {
    console.error("Error generating or parsing flashcards from AI:", error);
    return null;
  }
}

export async function performOCRWithGemini(imageBase64: string, mimeType: string = 'image/png'): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not set in the environment variables.');
  }
  const prompt = `Extract all readable text from this image. Return only the extracted text, nothing else.`;
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
  }
  const data = await response.json();
  try {
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error('Failed to extract text from Gemini OCR response.');
  }
}

// callGemini function (remains the same as last accepted version)
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!response.ok) {
    let errorDetails = `Gemini API error: ${response.status}`;
    try {
    const errorData = await response.json();
        console.error("Gemini API Error Response Body:", errorData);
        errorDetails += `: ${JSON.stringify(errorData.error ? errorData.error.message : errorData)}`;
    } catch (jsonError) {
        console.error("Failed to parse Gemini API error response as JSON");
        errorDetails += `: ${await response.text()}`;
    }
    throw new Error(errorDetails);
  }
  const data = await response.json();
  try {
    if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
      console.warn("Gemini response blocked due to safety reasons:", data.candidates[0].safetyRatings);
      throw new Error("Content generation blocked by AI safety policies. Please review the input text or adjust safety settings if possible.");
    }
    if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'MAX_TOKENS') {
        console.warn("Gemini response may have been truncated due to maximum token limits.");
    }
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
        console.error("Invalid Gemini response structure. Full response:", data);
        let missingPath = "data.candidates";
        if (data.candidates && data.candidates[0]) missingPath += "[0].content";
        if (data.candidates && data.candidates[0] && data.candidates[0].content) missingPath += ".parts";
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) missingPath += "[0].text";
        throw new Error(`Failed to extract text from Gemini response due to unexpected structure. Missing: ${missingPath}`);
    }
    return data.candidates[0].content.parts[0].text;
  } catch (e: any) {
    console.error("Error processing data in callGemini (after fetch):", data, "Error:", e);
    throw new Error(e.message || 'Failed to extract or process text from Gemini response.');
  }
} 