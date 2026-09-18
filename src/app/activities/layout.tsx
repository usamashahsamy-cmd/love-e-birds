export default function ActivitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-[565px] mx-auto bg-background relative w-full shadow-xl">
      {children}
    </div>
  );
}
