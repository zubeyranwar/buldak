import { Container } from "@/components/container";
import { Hero } from "@/components/hero";
import { Menu } from "@/components/menu";
import { Testimonals } from "@/components/testimonals";

export default function Home() {
  return (
    <main>
      <Container>
        <Hero />
        <Menu />
      </Container>
      <Testimonals />
    </main>
  );
}
