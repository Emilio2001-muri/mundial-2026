import { z } from 'zod'

export const predictionFormSchema = z.object({
  predicted_home_score: z.number().int().min(0).max(99),
  predicted_away_score: z.number().int().min(0).max(99),
  predicted_winner_team_id: z.string().uuid().nullable().optional(),
  predicted_draw: z.boolean().nullable().optional(),
  predicted_advancing_team_id: z.string().uuid().nullable().optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  comment: z.string().max(280).nullable().optional(),
  scorer_predictions: z.array(
    z.object({
      player_id: z.string().uuid(),
      predicted_goals: z.number().int().min(1).max(10),
    })
  ).optional(),
})

export type PredictionFormValues = z.infer<typeof predictionFormSchema>

export const globalPredictionFormSchema = z.object({
  champion_team_id: z.string().uuid().nullable(),
  runner_up_team_id: z.string().uuid().nullable(),
  third_place_team_id: z.string().uuid().nullable(),
  finalist_one_team_id: z.string().uuid().nullable(),
  finalist_two_team_id: z.string().uuid().nullable(),
  golden_ball_player_id: z.string().uuid().nullable(),
  silver_ball_player_id: z.string().uuid().nullable(),
  bronze_ball_player_id: z.string().uuid().nullable(),
  golden_boot_player_id: z.string().uuid().nullable(),
  golden_glove_player_id: z.string().uuid().nullable(),
  best_young_player_id: z.string().uuid().nullable(),
})

export type GlobalPredictionFormValues = z.infer<typeof globalPredictionFormSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginValues = z.infer<typeof loginSchema>

export const scoringRuleSchema = z.object({
  key: z.string().min(1),
  points: z.number().int().min(0).max(100),
  description: z.string().min(1),
  enabled: z.boolean(),
})

export type ScoringRuleValues = z.infer<typeof scoringRuleSchema>
