import { Container } from "@/components/container";
import { Hero } from "@/components/hero";
import { LayerInViewAnim } from "@/components/layer-in-view-anim";
import { MenuItem } from "@/components/menu-item";
import { getMenuData } from "@/lib/use-menu-data";

export default async function MenuPage() {
    const { items, catagories } = await getMenuData();

    const grouped = catagories
        .filter((cat) => cat.id !== "all")
        .map((cat) => ({
            category: cat,
            items: items.filter((item) => item.categoryName === cat.name),
        }))
        .filter(({ items }) => items.length > 0);

    return (
        <Container>
            <Hero />
            <section className="mt-24 grid grid-cols-1 md:grid-cols-4">
                <div className="spacer" />
                <div className="md:col-span-3 flex flex-col gap-16">
                    {grouped.map(({ category, items }) => (
                        <div key={category.id}>
                            <LayerInViewAnim as="h2" based="time" delay={0} duration={1} className="text-primary text-3xl lowercase mb-8">
                                {category.name}
                            </LayerInViewAnim>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map((item, index) => (
                                    <MenuItem
                                        key={item.id}
                                        index={index}
                                        item={item}
                                        itemCount={items.length}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </Container>
    );
}