import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { noteId } = await req.json();

    if (!noteId) {
      return new Response(
        JSON.stringify({ error: 'Note ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the note data
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return new Response(
        JSON.stringify({ error: 'Note not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Gemini API key is available
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing note:", noteId);
    console.log("Content length:", note.content?.length || 0);
    
    const content = note.content || '';
    
    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Note content is empty or too short to process' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const newPromptTemplate = `Please provide a comprehensive yet well-structured summary of the following text.
The summary should be suitable for someone who wants to quickly understand the main topics and essential details.

Organize your response as follows, using markdown for formatting:

### Overview
A brief, high-level summary of the entire text (2-3 sentences).

### Key Concepts & Details
Identify and elaborate on the core concepts, methodologies, and significant points discussed in the text.
- For each major concept, provide a short explanation.
- If specific principles, practices, or steps are mentioned (e.g., principles of a manifesto, practices of a methodology, steps in a process), list them as bullet points.
- If different approaches or types are discussed (e.g., different agile methods like XP and Scrum), briefly describe each.
- If comparisons are made (e.g., plan-driven vs. agile), highlight the key differences.
- If challenges or solutions are mentioned (e.g., scaling agile), summarize them.

### Main Takeaways
List 3-5 main takeaway messages or conclusions from the text as a bulleted list. This should be a concise list of the absolute most critical points.

Here is the text:

PLACEHOLDER_FOR_CONTENT`;
    
    try {
      const promptWithContent = newPromptTemplate.replace('PLACEHOLDER_FOR_CONTENT', content);
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptWithContent
            }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        console.error("Gemini API error:", errorData);
        throw new Error(`Gemini API error: ${geminiResponse.status} ${JSON.stringify(errorData)}`);
      }

      const geminiData = await geminiResponse.json();
      
      let summary = '';
      let keyPoints: string[] = [];
      let rawTextOutput = '';

      try {
        rawTextOutput = geminiData.candidates[0].content.parts[0].text;
        const overviewMatch = rawTextOutput.match(/### Overview\n([^#]+)/);
        if (overviewMatch && overviewMatch[1]) {
          summary = overviewMatch[1].trim();
        }

        const takeawaysMatch = rawTextOutput.match(/### Main Takeaways\n((?:- .+\n?)+)/);
        if (takeawaysMatch && takeawaysMatch[1]) {
          keyPoints = takeawaysMatch[1].trim().split('\n').map(pt => pt.substring(pt.indexOf('- ') + 2).trim());
        }
        
        // Fallback if parsing fails or parts are missing
        if (!summary && !keyPoints.length) {
            summary = rawTextOutput; // Use whole response if nothing specific parsed
            keyPoints = ["Could not extract specific takeaways."];
        } else if (!summary && keyPoints.length) {
            summary = "Summary could not be extracted.";
        } else if (summary && !keyPoints.length) {
            keyPoints = ["Key takeaways could not be extracted."];
        }

      } catch (e) {
        console.error("Error parsing Gemini response:", e, geminiData);
        summary = rawTextOutput || "An error occurred while generating the summary.";
        keyPoints = ["Failed to extract key points due to parsing error."];
      }
      
      // Record AI usage
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        operation_type: 'note_summary',
        tokens_used: Math.ceil(content.length / 4), // Rough estimate
        note_id: noteId,
        model_used: 'gemini-pro',
        request_data: { note_content_length: content.length },
        response_data: { 
          summary_length: summary.length,
          key_points_count: keyPoints.length
        }
      });

      // Update the note with processed content
      const { data: updatedNote, error: updateError } = await supabase
        .from('notes')
        .update({
          ai_processed: true,
          ai_summary: summary,
          ai_key_points: keyPoints
        })
        .eq('id', noteId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating note with AI processing:", updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update note with AI processing results', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          note: updatedNote
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      console.error("API error during processing:", apiError);
      return new Response(
        JSON.stringify({ 
          error: 'Error processing note with AI', 
          details: apiError.message,
          tryAgain: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Error processing note:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        tryAgain: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
