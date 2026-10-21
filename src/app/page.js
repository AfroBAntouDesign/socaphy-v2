import WelcomeSection from "../components/template/WelcomeSection";
import AssociationSection from "../components/template/AssociationSection";
import Nosservices from "../components/template/Nosservices";
import { getSessionUser } from "@/lib/session";

export const metadata = {
  title: "Accueil",
  description:
    "SOCAphy — la plateforme qui valorise la médecine traditionnelle camerounaise.",
};

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <>
      <WelcomeSection />
      <Nosservices user={user} />
      <AssociationSection />
    </>
  );
}