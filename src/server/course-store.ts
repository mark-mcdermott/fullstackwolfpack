import { eq } from 'drizzle-orm'
import type {
  CourseStore,
  EnrollInput,
  GeneratedLesson,
} from '@/core/generation'
import { db } from '../db'
import { courses, lessons, lessonSegments, quizQuestions } from '../db/schema'

// Drizzle-backed persistence for the generation orchestrator (runGeneration).
export function drizzleCourseStore(): CourseStore {
  return {
    async createCourse(input: EnrollInput): Promise<string> {
      const [course] = await db
        .insert(courses)
        .values({
          topicId: input.topicId,
          ownerUserId: input.ownerUserId,
          source: 'ai',
          difficulty: input.difficulty,
          status: 'generating',
        })
        .returning()
      return course.id
    },

    async addLesson(courseId, order, lesson: GeneratedLesson) {
      const [row] = await db
        .insert(lessons)
        .values({
          courseId,
          orderIndex: order,
          title: lesson.title,
          estMinutes: lesson.estMinutes,
        })
        .returning()

      let segOrder = 0
      for (const seg of lesson.segments) {
        const [segRow] = await db
          .insert(lessonSegments)
          .values({
            lessonId: row.id,
            orderIndex: segOrder++,
            type: seg.type,
            title: seg.title,
            content: { markdown: seg.body },
            estMinutes: seg.estMinutes,
          })
          .returning()

        if (seg.questions.length) {
          await db.insert(quizQuestions).values(
            seg.questions.map((q) => ({
              segmentId: segRow.id,
              type: q.type,
              prompt: q.prompt,
              options: q.options ?? null,
              correctIndex: q.correctIndex ?? null,
              expectedAnswer: q.expectedAnswer ?? null,
              explanation: q.explanation ?? null,
            })),
          )
        }
      }
    },

    async markReady(courseId) {
      await db
        .update(courses)
        .set({ status: 'ready' })
        .where(eq(courses.id, courseId))
    },

    async markFailed(courseId) {
      await db
        .update(courses)
        .set({ status: 'failed' })
        .where(eq(courses.id, courseId))
    },
  }
}
