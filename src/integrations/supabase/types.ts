export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      certificates: {
        Row: {
          attempt_id: string
          certificate_url: string | null
          id: string
          issued_at: string
          strengths: string[]
          student_name: string
          test_name: string
          tier: string
          weaknesses: string[]
        }
        Insert: {
          attempt_id: string
          certificate_url?: string | null
          id?: string
          issued_at?: string
          strengths: string[]
          student_name: string
          test_name: string
          tier: string
          weaknesses: string[]
        }
        Update: {
          attempt_id?: string
          certificate_url?: string | null
          id?: string
          issued_at?: string
          strengths?: string[]
          student_name?: string
          test_name?: string
          tier?: string
          weaknesses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "certificates_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          created_at: string
          grade_level: number | null
          id: string
          name: string
          school_id: string | null
          school_name: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_code?: string
          created_at?: string
          grade_level?: number | null
          id?: string
          name: string
          school_id?: string | null
          school_name?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_code?: string
          created_at?: string
          grade_level?: number | null
          id?: string
          name?: string
          school_id?: string | null
          school_name?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          attempt_id: string
          coupon_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          attempt_id: string
          coupon_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          attempt_id?: string
          coupon_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_amount: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_amount?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_amount?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          created_at: string
          district: string | null
          email: string
          grade_levels: string[] | null
          id: string
          message: string | null
          name: string
          package_interest: string | null
          phone: string | null
          school_name: string
          student_count: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          email: string
          grade_levels?: string[] | null
          id?: string
          message?: string | null
          name: string
          package_interest?: string | null
          phone?: string | null
          school_name: string
          student_count?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          email?: string
          grade_levels?: string[] | null
          id?: string
          message?: string | null
          name?: string
          package_interest?: string | null
          phone?: string | null
          school_name?: string
          student_count?: number | null
          title?: string | null
        }
        Relationships: []
      }
      follow_up_assessments: {
        Row: {
          checkpoint_label: string
          created_at: string
          created_by: string | null
          grade_level: number | null
          id: string
          result_attempt_id: string | null
          school_id: string | null
          source_attempt_id: string | null
          status: string
          student_id: string
          test_id: string
          unlock_date: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          checkpoint_label?: string
          created_at?: string
          created_by?: string | null
          grade_level?: number | null
          id?: string
          result_attempt_id?: string | null
          school_id?: string | null
          source_attempt_id?: string | null
          status?: string
          student_id: string
          test_id: string
          unlock_date?: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          checkpoint_label?: string
          created_at?: string
          created_by?: string | null
          grade_level?: number | null
          id?: string
          result_attempt_id?: string | null
          school_id?: string | null
          source_attempt_id?: string | null
          status?: string
          student_id?: string
          test_id?: string
          unlock_date?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_assessments_result_attempt_id_fkey"
            columns: ["result_attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_assessments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_assessments_source_attempt_id_fkey"
            columns: ["source_attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_assessments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_assessments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests_public"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          school_name: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          school_name?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          school_name?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          attempt_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          attempt_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attempt_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      phonics_attempts: {
        Row: {
          correct: boolean
          created_at: string
          day_number: number | null
          enrollment_id: string | null
          heard: string | null
          id: string
          mode: string
          target: string
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          day_number?: number | null
          enrollment_id?: string | null
          heard?: string | null
          id?: string
          mode: string
          target: string
          user_id: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          day_number?: number | null
          enrollment_id?: string | null
          heard?: string | null
          id?: string
          mode?: string
          target?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          created_at: string
          full_name: string
          id: string
          parent_email: string | null
          pause_reason: string | null
          school_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_status?: string
          created_at?: string
          full_name: string
          id: string
          parent_email?: string | null
          pause_reason?: string | null
          school_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_status?: string
          created_at?: string
          full_name?: string
          id?: string
          parent_email?: string | null
          pause_reason?: string | null
          school_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_diagnostic_transcripts: {
        Row: {
          admin_email: string | null
          admin_name: string | null
          all_questions_answered: boolean | null
          assessment_completed_at: string | null
          assessment_duration_seconds: number | null
          assessment_started_at: string | null
          audio_auto_delete_at: string | null
          audio_uploaded_at: string | null
          auto_delete_enabled: boolean
          completion_status: string | null
          confirmed_errors: Json | null
          consent_given: boolean
          created_at: string
          detected_errors: Json | null
          final_error_count: number | null
          grade_band: string
          grade_level: number | null
          id: string
          original_text: string
          passage_title: string
          student_name: string
          transcript: string | null
          updated_at: string
          user_id: string
          version: string
          word_timings: Json | null
        }
        Insert: {
          admin_email?: string | null
          admin_name?: string | null
          all_questions_answered?: boolean | null
          assessment_completed_at?: string | null
          assessment_duration_seconds?: number | null
          assessment_started_at?: string | null
          audio_auto_delete_at?: string | null
          audio_uploaded_at?: string | null
          auto_delete_enabled?: boolean
          completion_status?: string | null
          confirmed_errors?: Json | null
          consent_given?: boolean
          created_at?: string
          detected_errors?: Json | null
          final_error_count?: number | null
          grade_band: string
          grade_level?: number | null
          id?: string
          original_text: string
          passage_title: string
          student_name: string
          transcript?: string | null
          updated_at?: string
          user_id: string
          version: string
          word_timings?: Json | null
        }
        Update: {
          admin_email?: string | null
          admin_name?: string | null
          all_questions_answered?: boolean | null
          assessment_completed_at?: string | null
          assessment_duration_seconds?: number | null
          assessment_started_at?: string | null
          audio_auto_delete_at?: string | null
          audio_uploaded_at?: string | null
          auto_delete_enabled?: boolean
          completion_status?: string | null
          confirmed_errors?: Json | null
          consent_given?: boolean
          created_at?: string
          detected_errors?: Json | null
          final_error_count?: number | null
          grade_band?: string
          grade_level?: number | null
          id?: string
          original_text?: string
          passage_title?: string
          student_name?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
          version?: string
          word_timings?: Json | null
        }
        Relationships: []
      }
      reading_recovery_enrollments: {
        Row: {
          enrolled_at: string
          grade_level: number | null
          id: string
          is_active: boolean
          parent_email: string
          parent_name: string | null
          reading_challenges: string[] | null
          student_name: string
          updated_at: string
          user_id: string
          version_a_completed_at: string | null
          version_b_completed_at: string | null
        }
        Insert: {
          enrolled_at?: string
          grade_level?: number | null
          id?: string
          is_active?: boolean
          parent_email: string
          parent_name?: string | null
          reading_challenges?: string[] | null
          student_name: string
          updated_at?: string
          user_id: string
          version_a_completed_at?: string | null
          version_b_completed_at?: string | null
        }
        Update: {
          enrolled_at?: string
          grade_level?: number | null
          id?: string
          is_active?: boolean
          parent_email?: string
          parent_name?: string | null
          reading_challenges?: string[] | null
          student_name?: string
          updated_at?: string
          user_id?: string
          version_a_completed_at?: string | null
          version_b_completed_at?: string | null
        }
        Relationships: []
      }
      reading_recovery_progress: {
        Row: {
          activity_title: string
          completed_at: string | null
          created_at: string
          day_number: number
          enrollment_id: string
          id: string
          notes: string | null
        }
        Insert: {
          activity_title: string
          completed_at?: string | null
          created_at?: string
          day_number: number
          enrollment_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          activity_title?: string
          completed_at?: string | null
          created_at?: string
          day_number?: number
          enrollment_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_recovery_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "reading_recovery_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          is_claimed: boolean
          name: string
          setup_code: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          name: string
          setup_code?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          name?: string
          setup_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      tachs_attempt_events: {
        Row: {
          actor_id: string | null
          attempt_id: string
          created_at: string
          detail: Json
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          attempt_id: string
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          attempt_id?: string
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tachs_attempt_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tachs_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      tachs_attempt_sections: {
        Row: {
          attempt_id: string
          break_after_seconds: number
          created_at: string
          current_difficulty: number
          deadline_at: string | null
          difficulty_path: Json
          id: string
          item_count: number
          presented_question_ids: Json
          quotas_remaining: Json
          section_key: string
          section_order: number
          started_at: string | null
          status: string
          streak_correct: number
          streak_incorrect: number
          submit_reason: string | null
          submitted_at: string | null
          summary: Json | null
          time_limit_seconds: number
          time_used_seconds: number | null
          updated_at: string
        }
        Insert: {
          attempt_id: string
          break_after_seconds?: number
          created_at?: string
          current_difficulty?: number
          deadline_at?: string | null
          difficulty_path?: Json
          id?: string
          item_count: number
          presented_question_ids?: Json
          quotas_remaining?: Json
          section_key: string
          section_order: number
          started_at?: string | null
          status?: string
          streak_correct?: number
          streak_incorrect?: number
          submit_reason?: string | null
          submitted_at?: string | null
          summary?: Json | null
          time_limit_seconds: number
          time_used_seconds?: number | null
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          break_after_seconds?: number
          created_at?: string
          current_difficulty?: number
          deadline_at?: string | null
          difficulty_path?: Json
          id?: string
          item_count?: number
          presented_question_ids?: Json
          quotas_remaining?: Json
          section_key?: string
          section_order?: number
          started_at?: string | null
          status?: string
          streak_correct?: number
          streak_incorrect?: number
          submit_reason?: string | null
          submitted_at?: string | null
          summary?: Json | null
          time_limit_seconds?: number
          time_used_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tachs_attempt_sections_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tachs_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      tachs_attempts: {
        Row: {
          access_source: string
          ack_email_error: string | null
          ack_email_sent_at: string | null
          ack_email_status: string
          blueprint_id: string
          blueprint_version: number
          completed_at: string | null
          created_at: string
          current_section_key: string | null
          email_attempts: number
          email_error: string | null
          email_sent_at: string | null
          email_status: string
          grade_level: number | null
          id: string
          order_id: string | null
          parent_email: string | null
          parent_report_content: Json | null
          reopened_at: string | null
          reopened_by: string | null
          report_approved_at: string | null
          report_approved_by: string | null
          report_notes: string | null
          report_reviewed_at: string | null
          report_reviewed_by: string | null
          report_sent_at: string | null
          report_status: string
          results: Json | null
          school_id: string | null
          started_at: string
          status: string
          test_mode: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          access_source?: string
          ack_email_error?: string | null
          ack_email_sent_at?: string | null
          ack_email_status?: string
          blueprint_id: string
          blueprint_version: number
          completed_at?: string | null
          created_at?: string
          current_section_key?: string | null
          email_attempts?: number
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string
          grade_level?: number | null
          id?: string
          order_id?: string | null
          parent_email?: string | null
          parent_report_content?: Json | null
          reopened_at?: string | null
          reopened_by?: string | null
          report_approved_at?: string | null
          report_approved_by?: string | null
          report_notes?: string | null
          report_reviewed_at?: string | null
          report_reviewed_by?: string | null
          report_sent_at?: string | null
          report_status?: string
          results?: Json | null
          school_id?: string | null
          started_at?: string
          status?: string
          test_mode?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          access_source?: string
          ack_email_error?: string | null
          ack_email_sent_at?: string | null
          ack_email_status?: string
          blueprint_id?: string
          blueprint_version?: number
          completed_at?: string | null
          created_at?: string
          current_section_key?: string | null
          email_attempts?: number
          email_error?: string | null
          email_sent_at?: string | null
          email_status?: string
          grade_level?: number | null
          id?: string
          order_id?: string | null
          parent_email?: string | null
          parent_report_content?: Json | null
          reopened_at?: string | null
          reopened_by?: string | null
          report_approved_at?: string | null
          report_approved_by?: string | null
          report_notes?: string | null
          report_reviewed_at?: string | null
          report_reviewed_by?: string | null
          report_sent_at?: string | null
          report_status?: string
          results?: Json | null
          school_id?: string | null
          started_at?: string
          status?: string
          test_mode?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tachs_attempts_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "tachs_blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "tachs_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_attempts_report_approved_by_fkey"
            columns: ["report_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_attempts_report_reviewed_by_fkey"
            columns: ["report_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_attempts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tachs_blueprints: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          sections: Json
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          sections: Json
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          sections?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      tachs_orders: {
        Row: {
          amount_paid_cents: number | null
          attempt_id: string | null
          created_at: string
          currency: string
          exam_type: string
          fee_cents: number
          grant_reason: string | null
          granted_by: string | null
          id: string
          integration_identifier: string | null
          net_amount_cents: number
          payment_status: string
          source: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          total_cents: number
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount_paid_cents?: number | null
          attempt_id?: string | null
          created_at?: string
          currency?: string
          exam_type?: string
          fee_cents?: number
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          integration_identifier?: string | null
          net_amount_cents?: number
          payment_status?: string
          source?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_cents?: number
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount_paid_cents?: number | null
          attempt_id?: string | null
          created_at?: string
          currency?: string
          exam_type?: string
          fee_cents?: number
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          integration_identifier?: string | null
          net_amount_cents?: number
          payment_status?: string
          source?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_cents?: number
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tachs_orders_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tachs_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_orders_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tachs_questions: {
        Row: {
          blueprint_version: number
          choices: Json
          code: string
          correct_key: string
          created_at: string
          difficulty: number
          id: string
          is_active: boolean
          passage_id: string | null
          passage_text: string | null
          passage_title: string | null
          rationale: string | null
          section_key: string
          skill: string
          stem: string
          updated_at: string
          visual: Json | null
          visual_alt: string | null
        }
        Insert: {
          blueprint_version: number
          choices: Json
          code: string
          correct_key: string
          created_at?: string
          difficulty: number
          id?: string
          is_active?: boolean
          passage_id?: string | null
          passage_text?: string | null
          passage_title?: string | null
          rationale?: string | null
          section_key: string
          skill: string
          stem: string
          updated_at?: string
          visual?: Json | null
          visual_alt?: string | null
        }
        Update: {
          blueprint_version?: number
          choices?: Json
          code?: string
          correct_key?: string
          created_at?: string
          difficulty?: number
          id?: string
          is_active?: boolean
          passage_id?: string | null
          passage_text?: string | null
          passage_title?: string | null
          rationale?: string | null
          section_key?: string
          skill?: string
          stem?: string
          updated_at?: string
          visual?: Json | null
          visual_alt?: string | null
        }
        Relationships: []
      }
      tachs_responses: {
        Row: {
          answered_at: string | null
          attempt_id: string
          created_at: string
          difficulty: number
          id: string
          is_correct: boolean | null
          is_flagged: boolean
          position: number
          presented_at: string
          question_id: string
          section_id: string
          selected_key: string | null
          skill: string
          time_spent_seconds: number
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          created_at?: string
          difficulty: number
          id?: string
          is_correct?: boolean | null
          is_flagged?: boolean
          position: number
          presented_at?: string
          question_id: string
          section_id: string
          selected_key?: string | null
          skill: string
          time_spent_seconds?: number
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          created_at?: string
          difficulty?: number
          id?: string
          is_correct?: boolean | null
          is_flagged?: boolean
          position?: number
          presented_at?: string
          question_id?: string
          section_id?: string
          selected_key?: string | null
          skill?: string
          time_spent_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tachs_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tachs_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tachs_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tachs_responses_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "tachs_attempt_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          amount_paid: number | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string
          email_status: string | null
          follow_up_id: string | null
          grade_level: number | null
          id: string
          payment_status: string | null
          progress_state: Json | null
          school_id: string | null
          score: number | null
          skill_analysis: Json | null
          started_at: string
          strengths: string[] | null
          test_id: string
          tier: string | null
          total_questions: number | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          amount_paid?: number | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          email_status?: string | null
          follow_up_id?: string | null
          grade_level?: number | null
          id?: string
          payment_status?: string | null
          progress_state?: Json | null
          school_id?: string | null
          score?: number | null
          skill_analysis?: Json | null
          started_at?: string
          strengths?: string[] | null
          test_id: string
          tier?: string | null
          total_questions?: number | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          amount_paid?: number | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string
          email_status?: string | null
          follow_up_id?: string | null
          grade_level?: number | null
          id?: string
          payment_status?: string | null
          progress_state?: Json | null
          school_id?: string | null
          score?: number | null
          skill_analysis?: Json | null
          started_at?: string
          strengths?: string[] | null
          test_id?: string
          tier?: string | null
          total_questions?: number | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_follow_up_id_fkey"
            columns: ["follow_up_id"]
            isOneToOne: false
            referencedRelation: "follow_up_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_responses: {
        Row: {
          answer: string
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          max_points: number | null
          points_awarded: number | null
          question_id: string
          teacher_comment: string | null
        }
        Insert: {
          answer: string
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          max_points?: number | null
          points_awarded?: number | null
          question_id: string
          teacher_comment?: string | null
        }
        Update: {
          answer?: string
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          max_points?: number | null
          points_awarded?: number | null
          question_id?: string
          teacher_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_paid: boolean
          name: string
          price: number | null
          questions: Json
          test_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_paid?: boolean
          name: string
          price?: number | null
          questions?: Json
          test_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_paid?: boolean
          name?: string
          price?: number | null
          questions?: Json
          test_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tests_public: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string | null
          is_paid: boolean | null
          name: string | null
          price: number | null
          test_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string | null
          is_paid?: boolean | null
          name?: string | null
          price?: number | null
          test_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string | null
          is_paid?: boolean | null
          name?: string | null
          price?: number | null
          test_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: { invite_token: string; user_id: string }
        Returns: boolean
      }
      get_email_from_username: {
        Args: { input_username: string }
        Returns: string
      }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_invitation: {
        Args: { invite_token: string }
        Returns: {
          email: string
          role: Database["public"]["Enums"]["app_role"]
          school_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student" | "teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student", "teacher"],
    },
  },
} as const
