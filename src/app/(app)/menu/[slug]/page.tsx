import { Container } from "@/components/container";
import { MenuItem } from "@/components/menu-item";
import { MENU_ITEM_COUNT } from "@/components/menu-items";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const tag = [
    {
        title: "Price",
        price: "$16.99",
        oldPrice: "$18.99",
        saleVisible: true
    },
    {
        title: "Volume",
        value: "400ml",
        saleVisible: false
    },
    {
        title: "Kcal",
        value: "400ml",
        saleVisible: false
    },
    {
        title: "Kcal",
        value: "400ml",
        saleVisible: false
    },
    {
        title: "Kcal",
        value: "400ml",
        saleVisible: false
    }
]
export default function MenuItemDetail() {
    return (
        <Container>
            <main className="flex flex-col gap-2 pt-17.5">
                <section>
                    <div className="grid grid-cols-4">
                        <div />
                        <div className="flex flex-col gap-5 col-span-2">
                            <Button className="w-fit text-white">Bowls</Button>
                            <div className="flex flex-col gap-7.5">
                                <h1 className="font-sans!">Menu Item Name</h1>
                                <p className="body-low">Description.</p>
                            </div>
                        </div>
                        <div />
                    </div>
                    <div className="grid grid-cols-4">
                        <div />
                        <div className="flex flex-col gap-7.5 col-span-2">
                            <div
                                className="bg-[#EEE9E3] group-hover:bg-primary/10 flex items-center justify-center"
                            >
                                <Image
                                    src="/menu/ramen.png"
                                    alt="Ramen"
                                    width={500}
                                    height={500}
                                />
                            </div>
                            <p className="body-low">A crisp green juice packed with vitamins and minerals.</p>
                            <div className="flex justify-between">
                                <div></div>
                                <div />
                                <div className="flex flex-col items-end">
                                    <p className="body-low orange-link">tropical paradise bowl</p>
                                    <Image
                                        src="/menu/ramen.png"
                                        alt="Ramen"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="ml-10">
                            <div className="pt-2.5 flex flex-wrap gap-2">
                                {
                                    tag.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                            <Tag value={item} saleVisible={item.saleVisible} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </section>
                <section className="grid grid-cols-4">
                    <div />
                    <div className="col-span-3 flex flex-col gap-7.5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-sans!">other bowls</h2>
                            <Link href="/menu" className="nav-link text-primary!">All menu</Link>
                        </div>
                        <div className="grid grid-cols-3 gap-7.5">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <MenuItem key={index} index={index} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </Container>
    )
}

const Tag = ({ value, saleVisible }: { value: any, saleVisible: boolean }) => {
    return (
        <p className="w-fit flex gap-2 border border-primary rounded-[5px] nav-link text-primary! px-2 py-1">
            {saleVisible && (
                <>
                    <span className="line-through">{value.oldPrice}</span>
                    <span>{value.price}</span>
                </>
            )}
            <span>{value.value}</span>
        </p>
    )
}