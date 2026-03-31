import PasswordPage from "~/components/PasswordPage";

export default function MarzofkaFamilyPage() {
  return (
    <PasswordPage
      family="marzofka"
      familyTitle="Marzofka Family"
      labels={["Dean & Renae", "Nick", "Mikel"]}
      subtitle="Each of you has a riddle... the solutions unlock the reveal!"
      columns={1}
    />
  );
}
