// ==========================================
// Tissaia - Pipeline Configuration
// ==========================================

import { PipelineConfiguration } from './types';

export const PIPELINE_CONFIG: PipelineConfiguration = {
  pipeline_configuration: {
    meta: {
      id: 'tissaia-forensic-restoration',
      revision: '2.0.0',
      last_updated: new Date().toISOString(),
      environment: 'production'
    },
    global_constraints: {
      max_concurrent_restorations: 3,
      max_input_file_size_mb: 50,
      supported_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      security_sanitization: true
    },
    stages: {
      STAGE_1_INGESTION: {
        name: 'Ingestion & Heuristics',
        description: 'Wczytanie skanu i analiza heurystyczna (Edge/Hough)',
        timeout_ms: 30000,
        config: {
          heuristics_engine: {
            method: 'Analiza Krawędzi i Transformata Hougha',
            library: 'OpenCV.js (WASM)',
            parameters: {
              gaussian_blur_kernel: 5,
              canny_threshold_1: 50,
              canny_threshold_2: 150,
              hough_min_line_length: 50,
              hough_max_line_gap: 10
            }
          },
          thumbnail_generation: {
            max_width: 800,
            quality: 0.85,
            format: 'image/jpeg'
          }
        },
        ui_feedback: {
          loading_message: 'Analizowanie skanu...',
          success_message: 'Analiza zakończona',
          loading_states: ['Wczytywanie...', 'Detekcja krawędzi...', 'Analiza Hougha...']
        }
      },
      STAGE_2_DETECTION: {
        name: 'Neural Object Detection',
        description: 'Detekcja obiektów przy użyciu Vision AI (Gemini)',
        service_endpoint: 'geminiService.analyzeImage',
        model_config: {
          model_name: 'gemini-2.0-flash',
          temperature: 0.1,
          top_k: 1,
          max_output_tokens: 4096,
          safety_settings: 'BLOCK_NONE'
        },
        prompt_engineering: {
          system_role: 'You are a forensic image analysis expert specializing in detecting individual photographs within scanned album pages.',
          task_directive: `Analyze this scanned image and detect all individual photographs present.
For each detected photograph, provide precise bounding box coordinates.
The coordinates should be normalized (0-1 range) relative to the image dimensions.`,
          output_format_enforcement: `CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "detected_objects": [
    {
      "x": 0.1,
      "y": 0.1,
      "width": 0.3,
      "height": 0.4,
      "confidence": 0.95,
      "label": "photograph"
    }
  ],
  "total_count": 1
}
Do NOT include any text outside the JSON object.`,
          strategy_fallback: 'If detection fails, return {"detected_objects": [], "total_count": 0, "error": "detection_failed"}'
        },
        error_handling: {
          retry_count: 2,
          fallback_action: 'SWITCH_TO_MANUAL_CROP_UI'
        }
      },
      STAGE_3_SMART_CROP: {
        name: 'Smart Crop',
        description: 'Precyzyjne wycinanie zdjęć z marginesem higienicznym',
        execution_context: 'Browser Main Thread',
        logic_rules: {
          coordinate_mapping: 'Normalized (0-1) to pixel coordinates based on original resolution',
          hygiene_cut: {
            enabled: true,
            margin_percentage: 0.02,
            reason: 'Zapewnia czyste krawędzie bez artefaktów ze skanu'
          },
          rotation_handling: {
            auto_rotate: true,
            background_fill: '#FFFFFF'
          },
          output_format: {
            mime: 'image/png',
            quality: 0.95,
            encoding: 'base64'
          }
        }
      },
      STAGE_4_ALCHEMY: {
        name: 'Alchemy Restoration',
        description: 'Restauracja AI z outpaintingiem i korekcją kolorów',
        service_endpoint: 'geminiService.restoreImage',
        cost_estimation: '~0.02 USD per image',
        model_config: {
          model_name: 'gemini-2.0-flash-preview-image-generation',
          temperature: 0.4,
          max_output_tokens: 8192,
          safety_settings: 'BLOCK_NONE'
        },
        prompt_directives: {
          structure: {
            role: 'You are a professional photo restoration artist with expertise in vintage photograph restoration.',
            input_context: 'This is a cropped photograph from a scanned album page that needs restoration.',
            steps: [
              {
                id: 'OUTPAINTING',
                instruction: 'Extend the image edges naturally where cropping created incomplete borders. Fill missing areas with contextually appropriate content.',
                weight: 'High',
                constraint: 'Maintain photographic realism - no artistic interpretation'
              },
              {
                id: 'HYGIENE',
                instruction: 'Remove scanning artifacts, dust, scratches, and album page remnants from edges.',
                weight: 'High',
                negative_prompt: 'blurry, oversaturated, artificial'
              },
              {
                id: 'DETAIL',
                instruction: 'Enhance sharpness and recover fine details lost during scanning.',
                weight: 'Medium',
                constraint: 'Preserve original photograph character'
              },
              {
                id: 'COLOR_GRADING',
                instruction: 'Correct color balance and restore faded colors to natural tones.',
                weight: 'Medium',
                reference: 'Match era-appropriate color palette'
              }
            ]
          }
        },
        ui_feedback: {
          loading_message: 'Restauracja w toku...',
          success_message: 'Zdjęcie przywrócone!',
          loading_states: ['Outpainting...', 'Czyszczenie...', 'Wyostrzanie...', 'Korekcja kolorów...']
        }
      }
    },
    data_contracts: {
      ScanFile: {
        id: '',
        lifecycle_state: 'UPLOADING',
        metrics: {
          original_resolution: '0x0',
          processing_time_ms: 0
        }
      }
    }
  }
};

export default PIPELINE_CONFIG;
