import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary/90 to-sidebar-accent text-sidebar-primary-foreground shadow-[0_10px_20px_-14px_rgba(15,23,42,0.45)] ring-1 ring-sidebar-border/70">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-slate-950" />
            </div>
            <div className="ml-2 grid flex-1 text-left">
                <span className="truncate text-sm leading-tight font-semibold">
                    BertScan
                </span>
                <span className="text-[0.7rem] font-medium tracking-[0.22em] text-muted-foreground/80 uppercase">
                    Data Hub
                </span>
            </div>
        </>
    );
}
