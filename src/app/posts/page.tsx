export default function PostsPage() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Posts</h1>
                <p className="text-muted-foreground mb-4">
                    Looking for posts? Choose your portal:
                </p>
                <div className="flex gap-4 justify-center">
                    <a href="/app/clients" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Merchant Portal
                    </a>
                    <a href="/portal/posts" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Client Portal
                    </a>
                </div>
            </div>
        </div>
    );
}
