import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function CreatePostTest() {
  const { user, isLoading } = useAuth();

  console.log("CreatePostTest - User:", user);
  console.log("CreatePostTest - isLoading:", isLoading);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Post Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>User: {user ? `${user.fullName} (${user.role})` : 'None'}</p>
            <p>User Status: {user?.status || 'N/A'}</p>
            
            <Button>Test Button</Button>
            
            <div className="bg-gray-100 p-4 rounded">
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}