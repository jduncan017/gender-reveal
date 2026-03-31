import PasswordPage from "~/components/PasswordPage";

export default function DuncanFamilyPage() {
  return (
    <PasswordPage
      family="duncan"
      familyTitle="Duncan Family"
      labels={["Mom", "Dad", "Mimi", "Papa", "Jacque", "Jenna"]}
      subtitle="Enter the highlighted word from your crossword puzzle to unlock the reveal!"
      columns={2}
    />
  );
}
