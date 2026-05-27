-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "branch1" TEXT NOT NULL,
    "branch1TrainingStart" TIMESTAMP(3) NOT NULL,
    "branch1TrainingEnd" TIMESTAMP(3) NOT NULL,
    "branch1Duration" INTEGER NOT NULL,
    "branch2" TEXT NOT NULL,
    "branch2TrainingStart" TIMESTAMP(3) NOT NULL,
    "branch2TrainingEnd" TIMESTAMP(3) NOT NULL,
    "branch2Duration" INTEGER NOT NULL,
    "q1_benefit" INTEGER NOT NULL,
    "q2_apply_knowledge" INTEGER NOT NULL,
    "q3_consistency" INTEGER NOT NULL,
    "q4_1_duration_suitability" TEXT NOT NULL,
    "q4_2_branches_suitability" TEXT NOT NULL,
    "q5_clarity_branch1" INTEGER NOT NULL,
    "q5_clarity_branch2" INTEGER NOT NULL,
    "q6_volume_branch1" INTEGER NOT NULL,
    "q6_volume_branch2" INTEGER NOT NULL,
    "q7_readiness_branch1" INTEGER NOT NULL,
    "q7_readiness_branch2" INTEGER NOT NULL,
    "q8_trainer_knowledge_branch1" INTEGER NOT NULL,
    "q8_trainer_knowledge_branch2" INTEGER NOT NULL,
    "q9_safety_hygiene_branch1" INTEGER NOT NULL,
    "q9_safety_hygiene_branch2" INTEGER NOT NULL,
    "q10_trainer_care_branch1" INTEGER NOT NULL,
    "q10_trainer_care_branch2" INTEGER NOT NULL,
    "q11_atmosphere_branch1" INTEGER NOT NULL,
    "q11_atmosphere_branch2" INTEGER NOT NULL,
    "feedback12_challenging" TEXT,
    "feedback13_ideal_setup" TEXT,
    "feedback14_impressions" TEXT,
    "feedback15_suggestions" TEXT,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

