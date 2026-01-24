-- Create dev_playbooks table for development/testing without RLS
CREATE TABLE IF NOT EXISTS public.dev_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL DEFAULT '',          -- Markdown content
  description TEXT,                           -- Short description for grid
  category VARCHAR(100),                      -- Optional category
  is_default BOOLEAN DEFAULT FALSE,           -- Global default playbook
  created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL                 -- Soft delete
);

-- Create indexes
CREATE INDEX idx_dev_playbooks_created_at ON public.dev_playbooks(created_at DESC);
CREATE INDEX idx_dev_playbooks_is_default ON public.dev_playbooks(is_default) WHERE is_default = true AND deleted_at IS NULL;

-- Disable RLS for dev table
ALTER TABLE public.dev_playbooks DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role for testing
GRANT SELECT ON public.dev_playbooks TO anon;
GRANT INSERT ON public.dev_playbooks TO anon;
GRANT UPDATE ON public.dev_playbooks TO anon;
GRANT DELETE ON public.dev_playbooks TO anon;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_dev_playbooks_updated_at ON public.dev_playbooks;
CREATE TRIGGER update_dev_playbooks_updated_at
    BEFORE UPDATE ON public.dev_playbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default playbook in dev
CREATE OR REPLACE FUNCTION ensure_single_default_dev_playbook()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true AND NEW.deleted_at IS NULL THEN
        UPDATE public.dev_playbooks
        SET is_default = false
        WHERE id != NEW.id AND is_default = true AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS ensure_single_default_dev_playbook_trigger ON public.dev_playbooks;
CREATE TRIGGER ensure_single_default_dev_playbook_trigger
    BEFORE INSERT OR UPDATE ON public.dev_playbooks
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_dev_playbook();

-- Insert a sample playbook for testing
INSERT INTO public.dev_playbooks (name, content, description, category, is_default) VALUES
(
  'מדריך מכירות בסיסי',
  '# מדריך מכירות בסיסי

## שלב 1: פתיחת שיחה
- הציגו את עצמכם בצורה ידידותית
- שאלו איך אפשר לעזור

## שלב 2: זיהוי צרכים
- הקשיבו ללקוח
- שאלו שאלות פתוחות
- רשמו נקודות מפתח

## שלב 3: הצגת פתרון
- התאימו את ההצעה לצרכים
- הדגישו יתרונות רלוונטיים

## שלב 4: טיפול בהתנגדויות
- הקשיבו להתנגדות
- הבינו את השורש
- ענו בביטחון

## שלב 5: סגירה
- סכמו את השיחה
- הציעו צעד הבא ברור
- תאמו מעקב',
  'מדריך בסיסי לתהליך מכירה מלא',
  'מכירות',
  true
),
(
  'טיפול בלידים קרים',
  '# טיפול בלידים קרים

## אסטרטגיה

### זיהוי ליד קר
- לא ענה יותר מ-3 פעמים
- ביקש לחזור אליו ולא ענה
- הביע חוסר עניין

### גישת השחזור
1. **המתינו 2-3 ימים** לפני ניסיון נוסף
2. **שנו את הערוץ** - אם התקשרתם, נסו SMS
3. **הציעו ערך חדש** - מבצע, תוכן, הטבה

### תסריט לשיחה
> "היי [שם],
> שמתי לב שלא הספקנו לסיים את השיחה שלנו.
> יש לי עדכון שחשבתי שיעניין אותך..."

### מתי לוותר
- אחרי 5 ניסיונות ללא מענה
- אם ביקש במפורש להפסיק
- סמנו כ"אבוד" והמשיכו הלאה',
  'אסטרטגיות לחימום לידים שהתקררו',
  'מכירות',
  false
);
