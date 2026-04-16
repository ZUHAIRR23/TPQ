import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import About from '../components/About';
import Programs from '../components/Programs';
import Teachers from '../components/Teachers';
import Testimonials from '../components/Testimonials';
import AdmissionInfo from '../components/AdmissionInfo';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="font-sans text-gray-800 antialiased selection:bg-tpq-yellow selection:text-tpq-green overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <About />
      <Programs />
      <Teachers />
      <Testimonials />
      <AdmissionInfo />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
