import Image from 'next/image'
import Header from './components/Header'
import Footer from './components/Footer'
import { theme } from './styles/theme'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className={`${theme.colors.background.gradient} ${theme.layout.section.hero}`}>
          <div className={theme.layout.container}>
            <div className={theme.text.align.center}>
              <div className={`${theme.text.body.small} ${theme.spacing.small}`}>
                Chinese American Parents and Students Association, Montgomery County
              </div>
              <h1 className={`${theme.text.gradient.title} ${theme.text.heading.h1} ${theme.spacing.element}`}>
                CAPSA-MC Tutoring Program
              </h1>
              <p className={`${theme.text.body.large} ${theme.spacing.element} ${theme.layout.maxWidth.sm}`}>
                Empowering students through personalized one-to-one tutoring services
              </p>
              <button className={`${theme.button.primary.base} ${theme.button.primary.default}`}>
                Get Started
              </button>
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
                  One-to-one tutoring sessions tailored to each student's unique needs and learning style.
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
        <section id="about" className={`${theme.layout.section.default} ${theme.colors.background.secondary}`}>
          <div className={theme.layout.container}>
            <div className={`${theme.layout.maxWidth.sm} ${theme.text.align.center}`}>
              <h2 className={`${theme.text.heading.h2} ${theme.spacing.element}`}>
                About CAPSA-MC
              </h2>
              <p className={`${theme.text.body.small} ${theme.spacing.element}`}>
                Founded in 1988, CAPSA-MC is dedicated to supporting the K12 school community in Montgomery County, Maryland. 
                Our tutoring program connects qualified tutors with students to help them excel in their studies.
              </p>
              <button className={`${theme.button.primary.base} ${theme.button.primary.outline}`}>
                Learn More About Us
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
} 