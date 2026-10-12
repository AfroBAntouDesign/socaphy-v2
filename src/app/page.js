// src/app/page.js
import WelcomeSection from "../components/template/WelcomeSection";
import AssociationSection from "../components/template/AssociationSection";
import Nosservices from "../components/template/Nosservices";

export const metadata = {
  title: "Accueil",
  description:
    "SOCAphy — la plateforme qui valorise la médecine traditionnelle camerounaise.",
};

export default function HomePage() {
  return (
    <>
      <WelcomeSection />
      <Nosservices />
      <AssociationSection />
    </>
  );
}