require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./db');

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query(`
      TRUNCATE users, projects, videos, split_jobs, clips, templates, ai_analysis, exports, transcriptions,
      roles, user_roles, password_resets, email_verifications, notifications, audit_log, search_history
      RESTART IDENTITY CASCADE
    `);

    // Create demo user
    const hashedPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || 'demo123456', 10);
    const userResult = await client.query(`
      INSERT INTO users (email, password, name, avatar_url, email_verified, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [process.env.DEMO_EMAIL || 'demo@aisplitvideo.com', hashedPassword, 'Demo User', 'https://ui-avatars.com/api/?name=Demo+User', true, 'admin']);

    const userId = userResult.rows[0].id;

    // Create a second user for variety
    const hashedPassword2 = await bcrypt.hash('user123456', 10);
    const user2Result = await client.query(`
      INSERT INTO users (email, password, name, avatar_url, email_verified, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['user@aisplitvideo.com', hashedPassword2, 'Regular User', 'https://ui-avatars.com/api/?name=Regular+User', false, 'user']);

    const userId2 = user2Result.rows[0].id;

    // Seed Roles (16 items)
    const roles = [
      { name: 'admin', description: 'Full system access', permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles', 'view_audit_log', 'export_data', 'manage_settings'] },
      { name: 'editor', description: 'Can edit and manage content', permissions: ['read', 'write', 'delete', 'export_data'] },
      { name: 'viewer', description: 'Read-only access', permissions: ['read'] },
      { name: 'moderator', description: 'Content moderation access', permissions: ['read', 'write', 'delete', 'moderate_content'] },
      { name: 'uploader', description: 'Can upload videos', permissions: ['read', 'write', 'upload_video'] },
      { name: 'analyst', description: 'AI analysis access', permissions: ['read', 'run_analysis', 'view_reports'] },
      { name: 'exporter', description: 'Can export content', permissions: ['read', 'export_data', 'download'] },
      { name: 'project_manager', description: 'Manage projects', permissions: ['read', 'write', 'delete', 'manage_projects'] },
      { name: 'template_creator', description: 'Create and manage templates', permissions: ['read', 'write', 'manage_templates'] },
      { name: 'billing_admin', description: 'Billing management', permissions: ['read', 'manage_billing', 'view_invoices'] },
      { name: 'api_user', description: 'API-only access', permissions: ['api_read', 'api_write'] },
      { name: 'guest', description: 'Limited guest access', permissions: ['read_public'] },
      { name: 'super_admin', description: 'Super administrator', permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles', 'manage_settings', 'manage_billing', 'view_audit_log'] },
      { name: 'content_creator', description: 'Full content creation access', permissions: ['read', 'write', 'upload_video', 'run_analysis', 'export_data'] },
      { name: 'reviewer', description: 'Review and approve content', permissions: ['read', 'approve_content', 'reject_content'] },
      { name: 'support', description: 'Customer support access', permissions: ['read', 'manage_users', 'view_audit_log'] }
    ];

    const roleIds = [];
    for (const role of roles) {
      const result = await client.query(
        `INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING id`,
        [role.name, role.description, JSON.stringify(role.permissions)]
      );
      roleIds.push(result.rows[0].id);
    }

    // Seed User Roles (16 items)
    const userRoleAssignments = [
      { userId, roleId: roleIds[0] },  // admin
      { userId, roleId: roleIds[12] }, // super_admin
      { userId, roleId: roleIds[13] }, // content_creator
      { userId, roleId: roleIds[7] },  // project_manager
      { userId, roleId: roleIds[5] },  // analyst
      { userId, roleId: roleIds[6] },  // exporter
      { userId, roleId: roleIds[8] },  // template_creator
      { userId, roleId: roleIds[3] },  // moderator
      { userId2, roleId: roleIds[2] }, // viewer
      { userId2, roleId: roleIds[4] }, // uploader
      { userId2, roleId: roleIds[1] }, // editor
      { userId2, roleId: roleIds[13] }, // content_creator
      { userId2, roleId: roleIds[6] }, // exporter
      { userId2, roleId: roleIds[14] }, // reviewer
      { userId2, roleId: roleIds[15] }, // support
      { userId2, roleId: roleIds[10] }, // api_user
    ];

    for (const ur of userRoleAssignments) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [ur.userId, ur.roleId]
      );
    }

    // Seed Password Resets (16 items)
    for (let i = 0; i < 16; i++) {
      const token = uuidv4();
      const hoursAgo = i * 6;
      await client.query(
        `INSERT INTO password_resets (user_id, token, expires_at, used) VALUES ($1, $2, NOW() + INTERVAL '${24 - hoursAgo} hours', $3)`,
        [i < 8 ? userId : userId2, token, i < 4]
      );
    }

    // Seed Email Verifications (16 items)
    for (let i = 0; i < 16; i++) {
      const token = uuidv4();
      await client.query(
        `INSERT INTO email_verifications (user_id, token, verified, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '48 hours')`,
        [i < 8 ? userId : userId2, token, i < 8]
      );
    }

    // Seed Projects (15+ items)
    const projects = [
      { name: 'YouTube Shorts Collection', description: 'Short form content for YouTube', status: 'active', video_count: 12 },
      { name: 'TikTok Marketing Campaign', description: 'Viral content for TikTok', status: 'active', video_count: 8 },
      { name: 'Instagram Reels', description: 'Engaging reels for Instagram', status: 'active', video_count: 15 },
      { name: 'Product Demos', description: 'Product demonstration videos', status: 'active', video_count: 6 },
      { name: 'Tutorial Series', description: 'Educational tutorial content', status: 'completed', video_count: 20 },
      { name: 'Podcast Highlights', description: 'Best moments from podcasts', status: 'active', video_count: 10 },
      { name: 'Webinar Clips', description: 'Key insights from webinars', status: 'active', video_count: 5 },
      { name: 'Gaming Highlights', description: 'Epic gaming moments', status: 'active', video_count: 25 },
      { name: 'Travel Vlogs', description: 'Adventure travel content', status: 'completed', video_count: 18 },
      { name: 'Cooking Show Clips', description: 'Recipe highlights', status: 'active', video_count: 14 },
      { name: 'Fitness Content', description: 'Workout and fitness videos', status: 'active', video_count: 22 },
      { name: 'Music Covers', description: 'Song cover performances', status: 'active', video_count: 9 },
      { name: 'News Highlights', description: 'Breaking news summaries', status: 'active', video_count: 30 },
      { name: 'Comedy Sketches', description: 'Funny short sketches', status: 'active', video_count: 11 },
      { name: 'Tech Reviews', description: 'Gadget and software reviews', status: 'completed', video_count: 16 },
      { name: 'Fashion Lookbook', description: 'Style and fashion content', status: 'active', video_count: 7 }
    ];

    const projectIds = [];
    for (const project of projects) {
      const result = await client.query(`
        INSERT INTO projects (user_id, name, description, status, video_count, thumbnail_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [userId, project.name, project.description, project.status, project.video_count,
          `https://picsum.photos/seed/${project.name.replace(/\s/g, '')}/400/300`]);
      projectIds.push(result.rows[0].id);
    }

    // Seed Videos
    const youtubeVideos = [
      { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', description: 'Official music video', duration: 213, resolution: '1920x1080' },
      { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito', description: 'Official music video', duration: 282, resolution: '1920x1080' },
      { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE', description: 'Official music video', duration: 253, resolution: '1920x1080' },
      { id: 'fJ9rUzIMcZQ', title: 'Queen - Bohemian Rhapsody', description: 'Official video Remastered', duration: 367, resolution: '1920x1080' },
      { id: 'arj7oStGLkU', title: 'TED: Inside the Mind of a Master Procrastinator', description: 'Tim Urban TED Talk - Full presentation', duration: 840, resolution: '1920x1080' },
      { id: 'UF8uR6Z6KLc', title: 'Steve Jobs Stanford Commencement Speech 2005', description: 'Inspirational graduation speech', duration: 915, resolution: '1920x1080' },
      { id: 'xuCn8ux2gbs', title: 'history of the entire world, i guess', description: 'Bill Wurtz - Complete history video', duration: 1166, resolution: '1920x1080' },
      { id: 'aircAruvnKk', title: 'Big Buck Bunny - Full Animated Short Film', description: 'Open source animated film by Blender Foundation', duration: 596, resolution: '1920x1080' },
      { id: 'YE7VzlLtp-4', title: 'Big Buck Bunny 4K - Full Movie', description: 'High quality version of the Blender short film', duration: 634, resolution: '3840x2160' },
      { id: '8aGhZQkoFbQ', title: 'The Secret Life of Walter Mitty - Documentary', description: 'Behind the scenes documentary', duration: 2700, resolution: '1920x1080' },
      { id: 'w-HYZv6HzAs', title: 'Python Full Course for Beginners', description: 'Complete Python programming tutorial', duration: 14400, resolution: '1920x1080' },
      { id: 'rfscVS0vtbw', title: 'Learn Python - Full Course for Beginners', description: 'FreeCodeCamp Python tutorial', duration: 15600, resolution: '1920x1080' },
      { id: 'KJgsSFOSQv0', title: 'C Programming Tutorial for Beginners', description: 'Complete C language course', duration: 12600, resolution: '1920x1080' },
      { id: 'Ke90Tje7VS0', title: 'React JS Course for Beginners', description: 'Full React tutorial with projects', duration: 3960, resolution: '1920x1080' },
      { id: '0JUN9uj-rsI', title: 'JavaScript Full Course - 12 Hours', description: 'Complete JavaScript from basics to advanced', duration: 43200, resolution: '1920x1080' },
      { id: 'PkZNo7MFNFg', title: 'Learn JavaScript - Full Course for Beginners', description: 'FreeCodeCamp JavaScript course', duration: 12240, resolution: '1920x1080' },
      { id: 'SqcY0GlETPk', title: 'React Tutorial for Beginners', description: 'Complete React course with hooks', duration: 6180, resolution: '1920x1080' },
      { id: 'CgkZ7MvWUAA', title: 'Node.js Full Course for Beginners', description: 'Complete Node.js backend course', duration: 8400, resolution: '1920x1080' },
      { id: 'W6NZfCO5SIk', title: 'JavaScript Tutorial - Programming Course', description: '8 hour JavaScript bootcamp', duration: 28800, resolution: '1920x1080' },
      { id: 'jS4aFq5-91M', title: 'JavaScript Crash Course For Beginners', description: 'Traversy Media JS crash course', duration: 5700, resolution: '1920x1080' }
    ];

    const videoIds = [];
    for (let i = 0; i < youtubeVideos.length; i++) {
      const video = youtubeVideos[i];
      const projectId = projectIds[i % projectIds.length];
      const result = await client.query(`
        INSERT INTO videos (user_id, project_id, title, description, duration, file_size, resolution, format, status, thumbnail_url, file_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [userId, projectId, video.title, video.description, video.duration,
          Math.floor(Math.random() * 500000000) + 100000000,
          video.resolution, 'mp4', 'processed',
          `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
          video.id]);
      videoIds.push(result.rows[0].id);
    }

    // Seed Split Jobs (16 items)
    const splitJobs = [
      { name: 'Auto Scene Detection', split_type: 'scene', status: 'completed', progress: 100, clips_generated: 12 },
      { name: 'Time-based Split 30s', split_type: 'time', status: 'completed', progress: 100, clips_generated: 8 },
      { name: 'AI Highlight Detection', split_type: 'ai_highlight', status: 'completed', progress: 100, clips_generated: 5 },
      { name: 'Silence Detection Split', split_type: 'silence', status: 'completed', progress: 100, clips_generated: 15 },
      { name: 'Manual Timestamp Split', split_type: 'manual', status: 'completed', progress: 100, clips_generated: 6 },
      { name: 'Face Detection Split', split_type: 'face', status: 'completed', progress: 100, clips_generated: 4 },
      { name: 'Audio Peak Split', split_type: 'audio_peak', status: 'completed', progress: 100, clips_generated: 10 },
      { name: 'Keyword Detection', split_type: 'keyword', status: 'completed', progress: 100, clips_generated: 7 },
      { name: 'Chapter Based Split', split_type: 'chapter', status: 'completed', progress: 100, clips_generated: 9 },
      { name: 'Motion Detection', split_type: 'motion', status: 'completed', progress: 100, clips_generated: 8 },
      { name: 'Equal Duration Split', split_type: 'equal', status: 'completed', progress: 100, clips_generated: 20 },
      { name: 'Beat Sync Split', split_type: 'beat', status: 'completed', progress: 100, clips_generated: 16 },
      { name: 'Subtitle Based Split', split_type: 'subtitle', status: 'completed', progress: 100, clips_generated: 11 },
      { name: 'AI Content Analysis', split_type: 'ai_content', status: 'completed', progress: 100, clips_generated: 12 },
      { name: 'Custom Rules Split', split_type: 'custom', status: 'completed', progress: 100, clips_generated: 8 },
      { name: 'Social Media Optimizer', split_type: 'social', status: 'completed', progress: 100, clips_generated: 14 }
    ];

    const splitJobIds = [];
    for (let i = 0; i < splitJobs.length; i++) {
      const job = splitJobs[i];
      const videoId = videoIds[i % videoIds.length];
      const result = await client.query(`
        INSERT INTO split_jobs (user_id, video_id, name, split_type, status, progress, clips_generated, settings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [userId, videoId, job.name, job.split_type, job.status, job.progress, job.clips_generated,
          JSON.stringify({ minDuration: 5, maxDuration: 60, sensitivity: 0.7 })]);
      splitJobIds.push(result.rows[0].id);
    }

    // Seed Clips
    const clips = [
      { title: 'Never Gonna Give You Up - Chorus', start_time: 43, end_time: 88, ai_score: 0.95, ai_tags: ['chorus', 'viral', 'catchy'], ytId: 'dQw4w9WgXcQ' },
      { title: 'Despacito - Hook Section', start_time: 75, end_time: 120, ai_score: 0.88, ai_tags: ['hook', 'danceable'], ytId: 'kJQP7kiw5Fk' },
      { title: 'Gangnam Style - Dance Break', start_time: 60, end_time: 90, ai_score: 0.92, ai_tags: ['dance', 'viral'], ytId: '9bZkp7q19f0' },
      { title: 'Bohemian Rhapsody - Opera Section', start_time: 180, end_time: 240, ai_score: 0.97, ai_tags: ['opera', 'legendary'], ytId: 'fJ9rUzIMcZQ' },
      { title: 'Python Course - Chapter 1: Introduction', start_time: 0, end_time: 1800, ai_score: 0.91, ai_tags: ['python', 'basics', 'intro'], ytId: 'rfscVS0vtbw' },
      { title: 'Python Course - Chapter 2: Variables', start_time: 1800, end_time: 3600, ai_score: 0.89, ai_tags: ['python', 'variables'], ytId: 'rfscVS0vtbw' },
      { title: 'Python Course - Chapter 3: Functions', start_time: 3600, end_time: 5400, ai_score: 0.93, ai_tags: ['python', 'functions'], ytId: 'rfscVS0vtbw' },
      { title: 'JavaScript - Part 1: Fundamentals', start_time: 0, end_time: 1800, ai_score: 0.90, ai_tags: ['javascript', 'fundamentals'], ytId: 'PkZNo7MFNFg' },
      { title: 'JavaScript - Part 2: DOM Manipulation', start_time: 1800, end_time: 3600, ai_score: 0.88, ai_tags: ['javascript', 'dom'], ytId: 'PkZNo7MFNFg' },
      { title: 'React Tutorial - Component Basics', start_time: 0, end_time: 1200, ai_score: 0.92, ai_tags: ['react', 'components'], ytId: 'Ke90Tje7VS0' },
      { title: 'React Tutorial - State Management', start_time: 1200, end_time: 2400, ai_score: 0.94, ai_tags: ['react', 'state', 'hooks'], ytId: 'Ke90Tje7VS0' },
      { title: 'TED Talk - Procrastination Part 1', start_time: 0, end_time: 420, ai_score: 0.96, ai_tags: ['ted', 'productivity'], ytId: 'arj7oStGLkU' },
      { title: 'TED Talk - Procrastination Part 2', start_time: 420, end_time: 840, ai_score: 0.95, ai_tags: ['ted', 'motivation'], ytId: 'arj7oStGLkU' },
      { title: 'Steve Jobs Speech - Part 1', start_time: 0, end_time: 450, ai_score: 0.98, ai_tags: ['inspirational', 'life-advice'], ytId: 'UF8uR6Z6KLc' },
      { title: 'Steve Jobs Speech - Part 2', start_time: 450, end_time: 915, ai_score: 0.97, ai_tags: ['career', 'passion'], ytId: 'UF8uR6Z6KLc' },
      { title: 'Node.js Course - Server Setup', start_time: 0, end_time: 1800, ai_score: 0.87, ai_tags: ['nodejs', 'backend'], ytId: 'CgkZ7MvWUAA' }
    ];

    const clipIds = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const videoId = videoIds[i % videoIds.length];
      const splitJobId = splitJobIds[i % splitJobIds.length];
      const result = await client.query(`
        INSERT INTO clips (user_id, video_id, split_job_id, title, start_time, end_time, duration, ai_score, ai_tags, thumbnail_url, file_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [userId, videoId, splitJobId, clip.title, clip.start_time, clip.end_time,
          clip.end_time - clip.start_time, clip.ai_score, clip.ai_tags,
          `https://img.youtube.com/vi/${clip.ytId}/mqdefault.jpg`,
          clip.ytId, 'generated']);
      clipIds.push(result.rows[0].id);
    }

    // Seed Templates (16 items)
    const templates = [
      { name: 'YouTube Shorts Template', description: 'Optimized for YouTube Shorts', category: 'social', split_type: 'time', is_public: true, usage_count: 1250 },
      { name: 'TikTok Viral', description: 'Perfect for TikTok content', category: 'social', split_type: 'ai_highlight', is_public: true, usage_count: 2100 },
      { name: 'Instagram Reels', description: 'Instagram optimized format', category: 'social', split_type: 'time', is_public: true, usage_count: 1800 },
      { name: 'Podcast Highlights', description: 'Extract best podcast moments', category: 'podcast', split_type: 'silence', is_public: true, usage_count: 890 },
      { name: 'Tutorial Chapters', description: 'Split by tutorial sections', category: 'education', split_type: 'chapter', is_public: true, usage_count: 650 },
      { name: 'Gaming Kills', description: 'Detect action moments', category: 'gaming', split_type: 'motion', is_public: true, usage_count: 1500 },
      { name: 'Music Video Cuts', description: 'Beat-synced splits', category: 'music', split_type: 'beat', is_public: true, usage_count: 720 },
      { name: 'Interview Quotes', description: 'Extract key quotes', category: 'interview', split_type: 'keyword', is_public: true, usage_count: 430 },
      { name: 'Sports Highlights', description: 'Action detection', category: 'sports', split_type: 'motion', is_public: true, usage_count: 980 },
      { name: 'Webinar Segments', description: 'Split by topic changes', category: 'business', split_type: 'ai_content', is_public: true, usage_count: 340 },
      { name: 'Cooking Steps', description: 'Recipe step detection', category: 'cooking', split_type: 'scene', is_public: true, usage_count: 560 },
      { name: 'Workout Sets', description: 'Exercise detection', category: 'fitness', split_type: 'motion', is_public: true, usage_count: 670 },
      { name: 'News Segments', description: 'Story separation', category: 'news', split_type: 'scene', is_public: true, usage_count: 290 },
      { name: 'Comedy Bits', description: 'Laugh detection', category: 'comedy', split_type: 'audio_peak', is_public: true, usage_count: 810 },
      { name: 'Custom Duration', description: 'Fixed time intervals', category: 'general', split_type: 'equal', is_public: true, usage_count: 1100 },
      { name: 'Face Focus', description: 'Speaker detection', category: 'presentation', split_type: 'face', is_public: true, usage_count: 450 }
    ];

    for (const template of templates) {
      await client.query(`
        INSERT INTO templates (user_id, name, description, category, split_type, is_public, usage_count, settings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, template.name, template.description, template.category, template.split_type,
          template.is_public, template.usage_count,
          JSON.stringify({ minDuration: 15, maxDuration: 60, quality: 'high' })]);
    }

    // Seed AI Analysis (16 items)
    const aiAnalyses = [
      { analysis_type: 'scene_detection', model_used: 'gpt-4-vision', confidence_score: 0.94, processing_time: 45, status: 'completed' },
      { analysis_type: 'highlight_detection', model_used: 'claude-3-opus', confidence_score: 0.91, processing_time: 60, status: 'completed' },
      { analysis_type: 'content_moderation', model_used: 'gpt-4', confidence_score: 0.98, processing_time: 30, status: 'completed' },
      { analysis_type: 'transcription', model_used: 'whisper-large', confidence_score: 0.96, processing_time: 120, status: 'completed' },
      { analysis_type: 'sentiment_analysis', model_used: 'claude-3-sonnet', confidence_score: 0.89, processing_time: 25, status: 'completed' },
      { analysis_type: 'object_detection', model_used: 'gpt-4-vision', confidence_score: 0.92, processing_time: 55, status: 'completed' },
      { analysis_type: 'face_recognition', model_used: 'custom-face-model', confidence_score: 0.87, processing_time: 40, status: 'completed' },
      { analysis_type: 'audio_analysis', model_used: 'whisper-large', confidence_score: 0.93, processing_time: 35, status: 'completed' },
      { analysis_type: 'keyword_extraction', model_used: 'claude-3-haiku', confidence_score: 0.90, processing_time: 15, status: 'completed' },
      { analysis_type: 'summary_generation', model_used: 'gpt-4-turbo', confidence_score: 0.88, processing_time: 20, status: 'completed' },
      { analysis_type: 'emotion_detection', model_used: 'gpt-4-vision', confidence_score: 0.85, processing_time: 50, status: 'completed' },
      { analysis_type: 'action_recognition', model_used: 'custom-action-model', confidence_score: 0.82, processing_time: 70, status: 'completed' },
      { analysis_type: 'text_overlay_detection', model_used: 'gpt-4-vision', confidence_score: 0.95, processing_time: 28, status: 'completed' },
      { analysis_type: 'brand_detection', model_used: 'custom-brand-model', confidence_score: 0.91, processing_time: 32, status: 'completed' },
      { analysis_type: 'viral_potential', model_used: 'claude-3-opus', confidence_score: 0.78, processing_time: 45, status: 'completed' },
      { analysis_type: 'engagement_prediction', model_used: 'gpt-4-turbo', confidence_score: 0.81, processing_time: 38, status: 'completed' }
    ];

    for (let i = 0; i < aiAnalyses.length; i++) {
      const analysis = aiAnalyses[i];
      const videoId = videoIds[i % videoIds.length];
      await client.query(`
        INSERT INTO ai_analysis (user_id, video_id, analysis_type, model_used, confidence_score, processing_time, status, input_data, output_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [userId, videoId, analysis.analysis_type, analysis.model_used, analysis.confidence_score,
          analysis.processing_time, analysis.status,
          JSON.stringify({ video_url: `/uploads/videos/sample_${i + 1}.mp4` }),
          JSON.stringify({ results: [], metadata: { analyzed_at: new Date().toISOString() } })]);
    }

    // Seed Exports (16 items)
    const exportItems = [
      { name: 'YouTube Export 1080p', format: 'mp4', resolution: '1920x1080', status: 'completed', file_size: 150000000 },
      { name: 'TikTok Export Vertical', format: 'mp4', resolution: '1080x1920', status: 'completed', file_size: 80000000 },
      { name: 'Instagram Square', format: 'mp4', resolution: '1080x1080', status: 'completed', file_size: 65000000 },
      { name: 'Twitter Optimized', format: 'mp4', resolution: '1280x720', status: 'completed', file_size: 45000000 },
      { name: 'GIF Preview', format: 'gif', resolution: '480x270', status: 'completed', file_size: 5000000 },
      { name: 'Audio Only MP3', format: 'mp3', resolution: 'audio', status: 'completed', file_size: 8000000 },
      { name: 'Thumbnail Export', format: 'jpg', resolution: '1920x1080', status: 'completed', file_size: 500000 },
      { name: '4K Master Export', format: 'mp4', resolution: '3840x2160', status: 'completed', file_size: 450000000 },
      { name: 'Facebook Feed', format: 'mp4', resolution: '1280x720', status: 'completed', file_size: 55000000 },
      { name: 'LinkedIn Video', format: 'mp4', resolution: '1920x1080', status: 'completed', file_size: 120000000 },
      { name: 'WhatsApp Status', format: 'mp4', resolution: '720x1280', status: 'completed', file_size: 25000000 },
      { name: 'Pinterest Pin', format: 'mp4', resolution: '1000x1500', status: 'completed', file_size: 35000000 },
      { name: 'Snapchat Story', format: 'mp4', resolution: '1080x1920', status: 'completed', file_size: 40000000 },
      { name: 'WebM Web Export', format: 'webm', resolution: '1920x1080', status: 'completed', file_size: 95000000 },
      { name: 'Promo Clip 720p', format: 'mp4', resolution: '1280x720', status: 'completed', file_size: 38000000 },
      { name: 'Archive Backup', format: 'mov', resolution: '1920x1080', status: 'completed', file_size: 200000000 }
    ];

    for (let i = 0; i < exportItems.length; i++) {
      const exp = exportItems[i];
      const clipId = clipIds[i % clipIds.length];
      const videoId = videoIds[i % videoIds.length];
      await client.query(`
        INSERT INTO exports (user_id, clip_id, video_id, name, format, resolution, file_size, status, progress, file_url, settings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [userId, clipId, videoId, exp.name, exp.format, exp.resolution, exp.file_size,
          exp.status, 100,
          `/uploads/exports/export_${i + 1}.${exp.format}`,
          JSON.stringify({ quality: 'high', codec: 'h264' })]);
    }

    // Seed Notifications (16 items)
    const notificationItems = [
      { type: 'success', title: 'Video uploaded successfully', message: 'Your video "Python Full Course" has been uploaded and is ready for processing.', link: '/videos' },
      { type: 'info', title: 'Split job completed', message: 'Auto Scene Detection has finished processing. 12 clips were generated.', link: '/split-jobs' },
      { type: 'warning', title: 'Storage almost full', message: 'You are using 85% of your storage quota. Consider deleting unused files.', link: '/exports' },
      { type: 'error', title: 'Export failed', message: 'The 4K export for "Bohemian Rhapsody" failed due to insufficient memory.', link: '/exports' },
      { type: 'info', title: 'New template available', message: 'A new "AI Content Optimizer" template has been added to the public library.', link: '/templates' },
      { type: 'success', title: 'AI Analysis complete', message: 'Sentiment analysis for "TED Talk" is complete with 89% confidence.', link: '/ai-analysis' },
      { type: 'info', title: 'Weekly summary', message: 'You processed 15 videos and generated 45 clips this week. Great work!', link: '/' },
      { type: 'warning', title: 'Verify your email', message: 'Please verify your email address to unlock all features.', link: '/profile' },
      { type: 'success', title: 'Project archived', message: 'Your project "Travel Vlogs" has been archived successfully.', link: '/projects' },
      { type: 'info', title: 'System maintenance', message: 'Scheduled maintenance on Sunday 2am-4am EST. Service may be briefly unavailable.', link: null },
      { type: 'success', title: 'Batch upload complete', message: '8 videos were uploaded successfully to "Gaming Highlights" project.', link: '/projects' },
      { type: 'error', title: 'Transcription failed', message: 'Audio extraction failed for "JavaScript Crash Course". Please re-upload the video.', link: '/videos' },
      { type: 'info', title: 'Role updated', message: 'Your role has been updated to "Content Creator" by an administrator.', link: '/profile' },
      { type: 'success', title: 'Password changed', message: 'Your password has been changed successfully.', link: '/profile' },
      { type: 'warning', title: 'API rate limit', message: 'You are approaching the API rate limit. 85 of 100 requests used this hour.', link: null },
      { type: 'info', title: 'Feature update', message: 'New bulk export feature is now available! Export multiple clips at once.', link: '/exports' }
    ];

    for (let i = 0; i < notificationItems.length; i++) {
      const n = notificationItems[i];
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, read, link, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${i * 3} hours')`,
        [userId, n.type, n.title, n.message, i < 5, n.link]
      );
    }

    // Seed Audit Log (16 items)
    const auditEntries = [
      { action: 'user.login', entity_type: 'user', details: { ip: '192.168.1.1', browser: 'Chrome' } },
      { action: 'video.upload', entity_type: 'video', details: { filename: 'tutorial.mp4', size: '150MB' } },
      { action: 'project.create', entity_type: 'project', details: { name: 'YouTube Shorts Collection' } },
      { action: 'split_job.start', entity_type: 'split_job', details: { type: 'scene', video: 'Python Course' } },
      { action: 'clip.export', entity_type: 'clip', details: { format: 'mp4', resolution: '1080p' } },
      { action: 'template.create', entity_type: 'template', details: { name: 'TikTok Viral', public: true } },
      { action: 'user.update_profile', entity_type: 'user', details: { fields: ['name', 'avatar'] } },
      { action: 'video.delete', entity_type: 'video', details: { title: 'Old Recording', reason: 'cleanup' } },
      { action: 'ai_analysis.run', entity_type: 'ai_analysis', details: { type: 'sentiment', model: 'claude-3' } },
      { action: 'export.download', entity_type: 'export', details: { format: 'mp4', size: '80MB' } },
      { action: 'project.update', entity_type: 'project', details: { status: 'completed' } },
      { action: 'user.change_password', entity_type: 'user', details: { method: 'profile_settings' } },
      { action: 'role.assign', entity_type: 'role', details: { role: 'editor', target_user: 'user@test.com' } },
      { action: 'bulk.delete', entity_type: 'clip', details: { count: 5, reason: 'cleanup' } },
      { action: 'settings.update', entity_type: 'settings', details: { setting: 'notifications', value: 'enabled' } },
      { action: 'user.logout', entity_type: 'user', details: { session_duration: '2h 15m' } }
    ];

    for (let i = 0; i < auditEntries.length; i++) {
      const entry = auditEntries[i];
      await client.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${i * 2} hours')`,
        [userId, entry.action, entry.entity_type, i + 1, JSON.stringify(entry.details)]
      );
    }

    // Seed Search History (16 items)
    const searchHistoryItems = [
      { query: 'python tutorial', type: 'videos', results_count: 5 },
      { query: 'music video clips', type: 'clips', results_count: 12 },
      { query: 'TikTok template', type: 'templates', results_count: 3 },
      { query: 'scene detection', type: 'ai-analysis', results_count: 4 },
      { query: 'gaming highlights', type: 'projects', results_count: 1 },
      { query: 'react course', type: 'videos', results_count: 3 },
      { query: 'export 4K', type: 'exports', results_count: 2 },
      { query: 'javascript', type: 'all', results_count: 15 },
      { query: 'podcast', type: 'templates', results_count: 2 },
      { query: 'split by silence', type: 'split-jobs', results_count: 1 },
      { query: 'cooking', type: 'projects', results_count: 1 },
      { query: 'face detection', type: 'ai-analysis', results_count: 2 },
      { query: 'instagram reels', type: 'templates', results_count: 1 },
      { query: 'Node.js', type: 'videos', results_count: 2 },
      { query: 'viral content', type: 'all', results_count: 8 },
      { query: 'audio analysis', type: 'ai-analysis', results_count: 3 }
    ];

    for (let i = 0; i < searchHistoryItems.length; i++) {
      const s = searchHistoryItems[i];
      await client.query(
        `INSERT INTO search_history (user_id, query, type, results_count, created_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${i * 4} hours')`,
        [userId, s.query, s.type, s.results_count]
      );
    }

    await client.query('COMMIT');
    console.log('Seed completed successfully!');
    console.log('Demo user created:');
    console.log(`  Email: ${process.env.DEMO_EMAIL || 'demo@aisplitvideo.com'}`);
    console.log(`  Password: ${process.env.DEMO_PASSWORD || 'demo123456'}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(console.error);
