import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-between flex-col gap-4 font-mono text-sm lg:flex">
        <h1>Welcome To The Code</h1>
        <p>Please take a look</p>
      </div>
    </main>
  );
}
