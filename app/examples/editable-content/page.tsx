import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import EditableSection from '@/app/components/EditableSection';
import { theme } from '@/app/styles/theme';
import { PageLayout } from '@/app/components';

export default async function EditableContentPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = session?.user?.email === 'admin@example.com'; // Replace with your admin check logic

  return (
    <PageLayout>
      <section className={`${theme.layout.section.default} ${theme.colors.background.primary}`}>
        <div className={theme.layout.container}>
          <div className="max-w-4xl mx-auto">
            <h1 className={`${theme.text.heading.h1} ${theme.text.align.center} ${theme.spacing.section}`}>
              Editable Content Example
            </h1>
            
            <div className="space-y-8">
              <section className={theme.layout.card}>
                <h2 className={`${theme.text.heading.h2} ${theme.spacing.element}`}>Welcome Section</h2>
                <EditableSection
                  pagePath="/examples/editable-content"
                  sectionKey="welcome"
                  defaultContent="<p>Welcome to our website! This content can be edited by administrators.</p>"
                  isEditable={isAdmin}
                />
              </section>

              <section className={theme.layout.card}>
                <h2 className={`${theme.text.heading.h2} ${theme.spacing.element}`}>About Us</h2>
                <EditableSection
                  pagePath="/examples/editable-content"
                  sectionKey="about"
                  defaultContent="<p>Learn more about our company and mission.</p>"
                  isEditable={isAdmin}
                />
              </section>

              <section className={theme.layout.card}>
                <h2 className={`${theme.text.heading.h2} ${theme.spacing.element}`}>Contact Information</h2>
                <EditableSection
                  pagePath="/examples/editable-content"
                  sectionKey="contact"
                  defaultContent="<p>Get in touch with us through the following channels.</p>"
                  isEditable={isAdmin}
                />
              </section>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
} 