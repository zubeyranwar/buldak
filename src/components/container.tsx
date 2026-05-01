export const Container = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full max-w-400 mx-auto px-6 overflow-hidden">{children}</div>
    )
}
