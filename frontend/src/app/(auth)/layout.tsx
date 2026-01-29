import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ログイン | ZaiGo',
    description: 'ZaiGo 在庫管理システム - ログイン',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
