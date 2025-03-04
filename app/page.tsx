import { PageLayout } from './components'
import { theme } from './styles/theme'
import ScrollLink from './components/ScrollLink'

export default function HomePage() {
  return (
    <PageLayout>
      <section className={`${theme.colors.background.gradient} py-16 md:py-24`}>
        <div className={theme.layout.container}>
          <div className={theme.text.align.center}>
            <div className={`${theme.text.body.small} ${theme.spacing.small}`}>
              Welcome to
            </div>
            <h1 className={`${theme.text.heading.h1} ${theme.spacing.section}`}>
              CAPSA-MC Tutoring
            </h1>
            <p className={`${theme.text.body.large} ${theme.spacing.element}`}>
              Empowering students through personalized tutoring
            </p>
            <div className={theme.button.group.responsive}>
              <ScrollLink
                targetId="about"
                className={`${theme.button.primary.base} ${theme.button.primary.default}`}
              >
                Learn More
              </ScrollLink>
              <a
                href="/register"
                className={`${theme.button.primary.base} ${theme.button.primary.outline}`}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="program" className={`${theme.layout.section.default} ${theme.colors.background.primary}`}>
        <div className={theme.layout.container}>
          <h2 className={`${theme.text.heading.h2} ${theme.text.align.center} ${theme.spacing.section}`}>
            Why Choose Our Tutoring Program?
          </h2>
          <div className={theme.layout.grid.features}>
            <div className={theme.layout.card}>
              <h3 className={`${theme.text.heading.h4} ${theme.spacing.element}`}>Personalized Learning</h3>
              <p className={theme.text.body.small}>
                One-to-one tutoring sessions tailored to each student&apos;s unique needs and learning style.
              </p>
            </div>
            <div className={theme.layout.card}>
              <h3 className={`${theme.text.heading.h4} ${theme.spacing.element}`}>Expert Tutors</h3>
              <p className={theme.text.body.small}>
                Experienced and qualified tutors dedicated to helping students achieve their academic goals.
              </p>
            </div>
            <div className={theme.layout.card}>
              <h3 className={`${theme.text.heading.h4} ${theme.spacing.element}`}>Flexible Schedule</h3>
              <p className={theme.text.body.small}>
                Convenient scheduling options to accommodate both students and tutors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`${theme.colors.background.primary} py-16`}>
        <div className={theme.layout.container}>
          <div className={theme.text.align.center}>
            <h2 className={`${theme.text.heading.h2} ${theme.spacing.section}`}>
              About Us
            </h2>
            <p className={`${theme.text.body.base} ${theme.spacing.element}`}>
              CAPSA-MC is a student-run organization dedicated to providing free tutoring services
              to Montgomery College students. Our tutors are passionate about helping fellow students
              succeed in their academic journey.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  )
} 