import PasswordPage from "~/components/PasswordPage";

export default function DuncanFamilyPage() {
  return (
    <PasswordPage
      family="duncan"
      familyTitle="Duncan Family"
      labels={["Mom", "Dad", "Mimi", "Papa", "Jacque", "Jenna"]}
      subtitle="You know what to do. Enter your secret word to unlock the reveal."
      columns={2}
    />
  );
}
