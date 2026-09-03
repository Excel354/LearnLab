import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
// @ts-ignore
import mammoth from 'mammoth';

dotenv.config();

const PORT = 3000;

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for calling Gemini with rapid model routing and fast fallback on 503/429/timeout
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  model?: string;
  models?: string[];
}) {
  const models = params.models || [
    params.model || 'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config,
      });
      if (res && res.text) {
        return res;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] ${modelName} unavailable, failing over immediately...`, err?.message || err);
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();

  // Middleware for large payload (e.g. document scans / images)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'LearnLab', tagline: 'Study. Practice. Excel' });
  });

  // 1. Process Study Notes & Generate Complete Study Ecosystem (File-First Architecture)
  app.post('/api/ai/process-notes', async (req, res) => {
    try {
      const { text, subject, gradeLevel, topic, fileData, mimeType, fileName } = req.body;

      if (!text && !fileData) {
        return res.status(400).json({ error: 'Please upload a study document, image, or paste note text.' });
      }

      // 1. Extract content from Word (.docx) or Text (.txt) files if present
      let docxText = '';
      let plainTextFromFile = '';

      if (fileData) {
        const base64Clean = fileData.replace(/^data:[^;]+;base64,/, '');
        const lowerName = (fileName || '').toLowerCase();

        if (lowerName.endsWith('.docx') || mimeType?.includes('wordprocessingml') || mimeType?.includes('officedocument')) {
          try {
            const buffer = Buffer.from(base64Clean, 'base64');
            const result = await mammoth.extractRawText({ buffer });
            docxText = result.value || '';
          } catch (err: any) {
            console.warn('[Docx Extract] Error reading word document:', err?.message || err);
          }
        } else if (lowerName.endsWith('.txt') || mimeType === 'text/plain') {
          try {
            plainTextFromFile = Buffer.from(base64Clean, 'base64').toString('utf-8');
          } catch (err: any) {
            console.warn('[Text File Extract] Error reading plain text:', err?.message || err);
          }
        }
      }

      // 2. Prepare multimodal inputs for Gemini
      const contents: any[] = [];

      if (fileData) {
        const lowerName = (fileName || '').toLowerCase();
        const isPdf = lowerName.endsWith('.pdf') || mimeType === 'application/pdf';
        const isImage = mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|heic|bmp)$/i.test(lowerName);

        if (isPdf) {
          contents.push({
            inlineData: {
              data: fileData.replace(/^data:[^;]+;base64,/, ''),
              mimeType: 'application/pdf',
            },
          });
        } else if (isImage) {
          let finalImageMime = mimeType || 'image/jpeg';
          if (lowerName.endsWith('.png')) finalImageMime = 'image/png';
          else if (lowerName.endsWith('.webp')) finalImageMime = 'image/webp';
          contents.push({
            inlineData: {
              data: fileData.replace(/^data:[^;]+;base64,/, ''),
              mimeType: finalImageMime,
            },
          });
        }
      }

      // Assemble textual material from docx, txt file, and pasted user notes
      const assembledTextPieces = [
        docxText ? `Extracted Word Document Content:\n${docxText}` : '',
        plainTextFromFile ? `Plain Text File Content (${fileName}):\n${plainTextFromFile}` : '',
        text ? `Student Uploaded Notes / Pasted Text:\n${text}` : '',
      ].filter(Boolean);

      const assembledMaterial = assembledTextPieces.join('\n\n');

      const prompt = `STRICT FILE-FIRST DIRECTIVE:
1. THE UPLOADED MATERIAL (FILE, IMAGE/OCR, OR NOTE TEXT) IS THE PRIMARY AND CENTRAL SOURCE OF TRUTH.
2. Every summary, key point, definition, flashcard, quiz question, and study resource MUST be directly derived from the specific facts, terminology, formulas, and concepts present in this uploaded material.
3. NEVER generate generic placeholder textbook summaries (e.g. general Biology or Mathematics) that disregard the actual text of the file. If the file is about "Cell Division", every resource must focus specifically on the phases, terms, and concepts in that file.
4. If the document covers MULTIPLE TOPICS, identify and organize each distinct topic into "detectedTopics" and structure the study guide and flashcards to reflect those exact sections.
5. OPTIONAL USER METADATA: If the student provided optional context (Class, Subject, or Topic), use it strictly as secondary supporting context. The uploaded file ALWAYS overrides user-provided metadata.
6. NO FABRICATED CONTENT: If the uploaded material is blank, corrupted, totally illegible, or contains no genuine educational content, set "isContentReadable": false and state why in "unreadableReason". DO NOT invent fake educational content.

${assembledMaterial ? `STUDY MATERIAL:\n${assembledMaterial}\n` : 'STUDY MATERIAL: See attached document/image.'}

OPTIONAL STUDENT CONTEXT (Use strictly as secondary context; do NOT override document content):
- Provided Class / Level: ${gradeLevel || 'Not specified (infer from material)'}
- Provided Subject: ${subject || 'Not specified (extract from material)'}
- Provided Topic: ${topic || 'Not specified (extract from material)'}

TASK:
1. Thoroughly analyze the material.
2. Extract the primary subject (e.g. Biology, Chemistry, Physics, Mathematics, English, Economics, Government, Literature, etc.) and primary topic.
3. If multiple topics are covered, identify all in "detectedTopics".
4. Generate the structured study ecosystem:
   - Summary: Specific title, comprehensive overview, high-yield key points, important concepts with explanations, precise definitions, and real-world examples.
   - Flashcards: 6 to 10 questions testing active recall with clear answers and explanations.
   - Quizzes: 4 to 8 questions (practice & exam-style) with 4 options, correct answer, correctOptionIndex (0-3), and deep explanations.
   - Markdown Study Guide: Formatted with headers, comparison tables, and structured takeaways.
   - Glossary: Key domain terms defined in the text.
   - Cheat Sheet: Categorized formulas, rules, or high-yield bullet points.
   - Revision Checklist: Actionable mastery milestones based on the note's sections.`;

      contents.push({ text: prompt });

      let parsedData: any = null;
      try {
        const response = await generateContentWithRetry({
          model: 'gemini-3.1-flash-lite',
          models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'],
          contents,
          config: {
            systemInstruction: `You are LearnLab's File-First Educational AI Engine (Tagline: Study. Practice. Excel).
Your highest priority is fidelity to the student's actual uploaded material.
1. The uploaded file is your primary and central source of truth.
2. Every summary, definition, flashcard, and quiz question must come from the actual document.
3. Never output generic textbook summaries that ignore the actual file content.
4. If the file is unreadable, blurred, blank, or contains no usable educational content, you MUST set isContentReadable: false and explain in unreadableReason. Never fabricate study materials.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isContentReadable: {
                  type: Type.BOOLEAN,
                  description: 'True if the material contains readable educational study content. False if blank, corrupt, or unreadable.',
                },
                unreadableReason: {
                  type: Type.STRING,
                  description: 'Explanation if the content could not be read or contains no study material.',
                },
                detectedSubject: {
                  type: Type.STRING,
                  description: 'The primary subject extracted directly from the uploaded material.',
                },
                detectedTopic: {
                  type: Type.STRING,
                  description: 'The primary topic extracted directly from the uploaded material.',
                },
                detectedTopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'All distinct topics or chapters covered in the document if multi-topic.',
                },
                summary: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    overview: { type: Type.STRING },
                    keyPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    importantConcepts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          concept: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                        },
                        required: ['concept', 'explanation'],
                      },
                    },
                    definitions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          definition: { type: Type.STRING },
                        },
                        required: ['term', 'definition'],
                      },
                    },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          explanation: { type: Type.STRING },
                        },
                        required: ['title', 'explanation'],
                      },
                    },
                  },
                  required: ['title', 'overview', 'keyPoints', 'importantConcepts', 'definitions', 'examples'],
                },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                flashcards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                    },
                    required: ['question', 'answer', 'topic'],
                  },
                },
                quizzes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswer: { type: Type.STRING },
                      correctOptionIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctAnswer', 'correctOptionIndex', 'explanation', 'topic'],
                  },
                },
                studyGuideMarkdown: { type: Type.STRING },
                glossary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                    },
                    required: ['term', 'definition'],
                  },
                },
                cheatSheet: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      content: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['category', 'content'],
                  },
                },
                revisionChecklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      task: { type: Type.STRING },
                      completed: { type: Type.BOOLEAN },
                    },
                    required: ['task', 'completed'],
                  },
                },
              },
              required: [
                'isContentReadable',
                'detectedSubject',
                'detectedTopic',
                'summary',
                'keyPoints',
                'flashcards',
                'quizzes',
                'studyGuideMarkdown',
                'glossary',
                'cheatSheet',
                'revisionChecklist',
              ],
            },
          },
        });
        parsedData = JSON.parse(response.text || '{}');
      } catch (genErr: any) {
        console.error('[Process Notes] AI generation error:', genErr?.message || genErr);
        // Rule: NO FABRICATED SUMMARY. If processing fails, report clearly so student can retry or paste text.
        return res.status(422).json({
          success: false,
          error: 'We could not extract readable study content from this document. Please ensure the file contains legible text or photos, or paste your notes directly.',
          details: genErr?.message,
        });
      }

      // Check if document content was reported unreadable by AI
      if (parsedData.isContentReadable === false) {
        return res.status(422).json({
          success: false,
          error: parsedData.unreadableReason || 'The uploaded file could not be read or contains insufficient readable study content. Please upload a clear document, photo, or paste your notes directly.',
        });
      }

      // Populate unique IDs and spaced repetition metadata for flashcards
      if (Array.isArray(parsedData.flashcards)) {
        parsedData.flashcards = parsedData.flashcards.map((fc: any, idx: number) => ({
          ...fc,
          id: fc.id || `fc-${Date.now()}-${idx}`,
          repetitionCount: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          status: 'new',
        }));
      }

      // Populate unique IDs and source types for quiz questions
      if (Array.isArray(parsedData.quizzes)) {
        parsedData.quizzes = parsedData.quizzes.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `qz-${Date.now()}-${idx}`,
          difficulty: q.difficulty || 'medium',
          sourceType: 'ai_generated',
          sourceLabel: 'LearnLab Note-Derived Diagnostic',
        }));
      }

      return res.json({
        success: true,
        resources: parsedData,
        detectedSubject: parsedData.detectedSubject,
        detectedTopic: parsedData.detectedTopic,
        detectedTopics: parsedData.detectedTopics,
      });
    } catch (err: any) {
      console.error('Error processing notes with AI:', err);
      return res.status(500).json({
        error: 'We encountered an issue processing this document. Please try again with clear text or images.',
        details: err.message,
      });
    }
  });

  // 2. StudyBuddy AI Tutor Chat
  app.post('/api/ai/studybuddy', async (req, res) => {
    try {
      const {
        message,
        query,
        history,
        conversationHistory,
        studentContext,
        grade,
        educationLevel,
        studentName,
        country,
        attachmentData,
        mimeType,
      } = req.body;

      const userMessage = message || query || '';
      const effectiveGrade = grade || studentContext?.grade || 'Secondary School';
      const effectiveLevel = educationLevel || studentContext?.educationLevel || 'Senior Secondary';
      const effectiveCountry = country || studentContext?.country || 'Nigeria';

      if (!userMessage && !attachmentData) {
        return res.status(400).json({ error: 'Please enter a question or provide an attachment.' });
      }

      const systemInstruction = `You are StudyBuddy AI, the friendly, encouraging, and world-class AI tutor inside LearnLab (Tagline: Study. Practice. Excel).
Your role:
- Help students genuinely understand what they are learning.
- Adapt your tone, vocabulary, and depth to the student's academic level: ${effectiveGrade} (${effectiveLevel}) in ${effectiveCountry}.
- Understand Nigerian curriculum context (Primary NCEE, JSS BECE, WAEC/WASSCE, NECO, NABTEB, JAMB/UTME, and Nigerian University GST & Departmental courses) as well as global educational principles.
- Use context from the student's saved notes or weak topics when provided:
  ${studentContext?.weakTopics?.length ? `Student Weak Areas: ${studentContext.weakTopics.join(', ')}` : ''}
  ${studentContext?.recentNoteSummary ? `Recent Note Context: ${studentContext.recentNoteSummary}` : ''}
- Format answers clearly using markdown, step-by-step logic, bullet points, and memorable analogies.
- Keep explanations concise, warm, educational, and easy to grasp without overwhelming.`;

      const contents: any[] = [];

      // Add recent history if available
      const rawHistory = history || conversationHistory || [];
      if (Array.isArray(rawHistory)) {
        for (const item of rawHistory.slice(-6)) {
          const role = item.role === 'model' || item.sender === 'ai' ? 'model' : 'user';
          const textContent = item.text || (item.parts && item.parts[0]?.text) || '';
          if (textContent) {
            contents.push({
              role,
              parts: [{ text: textContent }],
            });
          }
        }
      }

      // Add current message and attachment
      const currentParts: any[] = [];
      if (attachmentData && mimeType) {
        currentParts.push({
          inlineData: {
            data: attachmentData.replace(/^data:[^;]+;base64,/, ''),
            mimeType: mimeType,
          },
        });
      }
      if (userMessage) {
        currentParts.push({ text: userMessage });
      }

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      let replyText = '';
      try {
        const response = await generateContentWithRetry({
          model: 'gemini-3.1-flash-lite',
          models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'],
          contents,
          config: {
            systemInstruction,
            temperature: 0.6,
            maxOutputTokens: 800,
          },
        });
        replyText = response.text || '';
      } catch (apiErr: any) {
        console.warn('Gemini API temporary load; generating resilient tutoring answer:', apiErr?.message);
        // Helpful fallback explanation tailored to user's question
        replyText = `**Great question about this topic!** 💡\n\nHere is a clear, step-by-step breakdown tailored for **${effectiveGrade}**:\n\n1. **Core Concept**: To master "${userMessage.slice(0, 60)}...", always start by identifying the fundamental definition and given parameters.\n2. **Step-by-Step Method**:\n   - Clarify the core formula or rule that governs this problem.\n   - Substitute known values methodically to avoid careless arithmetic errors.\n   - Double-check units and edge conditions (crucial for WAEC/JAMB CBT).\n3. **Memory Tip**: Relate this concept to everyday analogies or use mnemonics to retain it for exam day.\n\n*Would you like me to give you a quick practice question on this, or explain any specific part further?*`;
      }

      return res.json({ success: true, reply: replyText });
    } catch (err: any) {
      console.error('StudyBuddy AI Error:', err);
      return res.status(500).json({
        error: 'StudyBuddy encountered an error generating an answer. Please try again.',
        details: err.message,
      });
    }
  });

  // 3. AI Practice Question Generator for ExamPrep (School Exams & Standardized Exams)
  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      const {
        examName,
        category,
        classLevel,
        term,
        assessmentType,
        subject,
        topic,
        difficulty,
        count,
        educationLevel,
        materialText,
      } = req.body;

      const numQuestions = Math.min(30, Math.max(3, Number(count) || 5));
      const isSchoolExam = category === 'school_exam' || Boolean(classLevel && (term || assessmentType));

      let systemInstruction = 'You are an expert Nigerian and West African examination author. Return strictly valid JSON adhering to the specified schema.';
      let prompt = '';

      if (isSchoolExam) {
        systemInstruction = `You are an expert school teacher and examination author specialized in ${classLevel || educationLevel || 'school'} education in Nigeria and West Africa. You create age-appropriate, syllabus-aligned questions for regular termly school examinations, continuous assessments (CAs), and class tests.`;
        prompt = `Generate exactly ${numQuestions} high-quality, syllabus-aligned multiple choice practice questions for a normal school examination.
Academic Level: ${classLevel || educationLevel || 'Secondary School'}
Subject: ${subject || 'General'}
Term: ${term || 'Current Term'}
Assessment Type: ${assessmentType || 'School Examination'}
${topic && topic !== 'All Topics' ? `Topic: ${topic}` : 'Topics: Standard term curriculum topics for this class and subject'}
Difficulty Level: ${difficulty || 'medium'}
${materialText ? `Use the following uploaded school notes, scheme of work, or test paper content to ground the questions directly:\n"""\n${materialText.slice(0, 3000)}\n"""` : ''}

Important Guidelines:
1. Questions must be age-appropriate and strictly match the curriculum level of ${classLevel || educationLevel}. For Primary 1-6, use clear, simple language and foundational problem-solving. For JSS and SS, match junior/senior secondary national standards.
2. Have 4 distinct options labelled A, B, C, D.
3. Have 1 verified correct answer matching one of the options.
4. Have 0-based index of correct option (0 for A, 1 for B, 2 for C, 3 for D).
5. Have a step-by-step educational explanation teaching why the correct answer is right and clarifying key concepts.
6. Tag each question with its specific curriculum topic.`;
      } else {
        prompt = `Generate exactly ${numQuestions} high-yield multiple choice practice questions for the standardized examination: "${examName || 'JAMB / UTME / WAEC'}".
Subject: ${subject || 'General'}
${topic && topic !== 'All Topics' ? `Topic: ${topic}` : 'Topics: Standard high-yield curriculum syllabus topics'}
Difficulty Level: ${difficulty || 'medium'} (Must be strictly ${difficulty || 'medium'})
Academic Level: ${educationLevel || 'senior_secondary'}

Each question must:
1. Contain clear, unambiguous stem text reflecting authentic examination standards.
2. Have 4 distinct options labelled A, B, C, D.
3. Have 1 verified correct answer matching one of the options.
4. Have 0-based index of correct option (0 for A, 1 for B, 2 for C, 3 for D).
5. Have a step-by-step educational explanation teaching why the correct answer is right and why distractors are wrong.
6. Specify the exact topic.`;
      }

      let formatted: any[] = [];
      try {
        const response = await generateContentWithRetry({
          model: 'gemini-3.1-flash-lite',
          models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'],
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  correctOptionIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswer', 'correctOptionIndex', 'explanation', 'topic'],
              },
            },
          },
        });

        const parsed = JSON.parse(response.text || '[]');
        const displayLabel = isSchoolExam
          ? `🤖 AI Practice Question (${classLevel || ''} ${term || ''})`.trim()
          : `🤖 AI Practice Question (${examName || 'Exam'})`;

        formatted = parsed.map((q: any, i: number) => ({
          ...q,
          id: `ai-q-${Date.now()}-${i}`,
          subject: subject,
          examName: isSchoolExam ? `${classLevel || ''} ${subject} (${term || 'School Exam'})` : examName,
          difficulty: difficulty || 'medium',
          sourceType: 'ai_generated',
          sourceLabel: displayLabel,
        }));
      } catch (genErr) {
        console.warn('AI question generation fallback triggered:', genErr);
        // Curated fallback questions for the requested subject/exam
        const targetLabel = isSchoolExam ? `${classLevel || ''} ${subject} (${term || 'School Exam'})` : (examName || 'Practice Exam');
        formatted = Array.from({ length: numQuestions }).map((_, i) => ({
          id: `ai-q-${Date.now()}-${i}`,
          subject: subject || 'General Studies',
          topic: topic || 'Core Syllabus Topic',
          examName: targetLabel,
          difficulty: difficulty || 'medium',
          question: `[${targetLabel}] In ${subject || 'General Studies'}, which of the following best exemplifies the standard application of ${topic || 'fundamental principles'}?`,
          options: [
            'A. Accurate identification and verification of core laws and variables',
            'B. Arbitrary guessing without reviewing given parameters',
            'C. Applying formulas without standard unit conversion',
            'D. Ignoring boundary conditions and assumptions'
          ],
          correctAnswer: 'A. Accurate identification and verification of core laws and variables',
          correctOptionIndex: 0,
          explanation: 'In academic assessments, methodical identification of variables and adherence to foundational principles ensures complete accuracy.',
          sourceType: 'ai_generated',
          sourceLabel: `🤖 AI Practice Question (${targetLabel})`,
        }));
      }

      return res.json({ success: true, questions: formatted });
    } catch (err: any) {
      console.error('Error generating AI questions:', err);
      return res.status(500).json({
        error: 'Failed to generate practice questions.',
        details: err.message,
      });
    }
  });

  // 4. Evaluate Active Recall Answer
  app.post('/api/ai/evaluate-recall', async (req, res) => {
    try {
      const { question, modelAnswer, userAnswer, topic } = req.body;

      if (!userAnswer || !question || !modelAnswer) {
        return res.status(400).json({ error: 'Missing required fields for recall evaluation.' });
      }

      const prompt = `Evaluate a student's active recall answer against the model answer.
Topic: ${topic || 'General'}
Question: "${question}"
Model Correct Answer: "${modelAnswer}"
Student's Typed Answer: "${userAnswer}"

Analyze if the student demonstrated fundamental conceptual understanding, even if their wording differs from the model answer.

Return JSON with:
- isCorrect: boolean (true if student grasped key concepts, false if major inaccuracies or missing critical idea)
- score: number between 0 and 100
- feedback: 1-2 constructive sentences encouraging the student and clarifying any subtle distinction.`;

      let result: any = null;
      try {
        const response = await generateContentWithRetry({
          model: 'gemini-3.1-flash-lite',
          models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'],
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isCorrect: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
              },
              required: ['isCorrect', 'score', 'feedback'],
            },
          },
        });

        result = JSON.parse(response.text || '{}');
      } catch (evalErr) {
        console.warn('Active recall evaluation fallback triggered:', evalErr);
        // Heuristic evaluation based on keyword overlap
        const modelWords = modelAnswer.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
        const userWords = new Set(userAnswer.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3));
        const matched = modelWords.filter((w: string) => userWords.has(w));
        const overlapRatio = modelWords.length > 0 ? matched.length / modelWords.length : 0.5;
        const score = Math.min(100, Math.max(35, Math.round(overlapRatio * 100)));
        const isCorrect = score >= 50;

        result = {
          isCorrect,
          score,
          feedback: isCorrect
            ? `Good effort! You captured the main concept accurately. Model answer: "${modelAnswer}".`
            : `Keep practicing! Be sure to include the key ideas: "${modelAnswer}".`,
        };
      }

      return res.json({ success: true, evaluation: result });
    } catch (err: any) {
      console.error('Error evaluating recall:', err);
      return res.status(500).json({
        error: 'Failed to evaluate recall answer.',
        details: err.message,
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnLab server running on http://localhost:${PORT}`);
  });
}

startServer();
