import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Menu } from "@/components/menu";
import { Navbar } from "@/components/navbar";
import { Testimonals } from "@/components/testimonals";

export default function Home() {
  return (
    <main>
      <Container>
        <Navbar />
        <Hero />
        <Menu />
      </Container>
      <Testimonals />
      <Footer />
    </main>
  );
}
