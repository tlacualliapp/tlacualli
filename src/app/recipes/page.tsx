import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function RecipesPage() {
  return (
    <AdminLayout>
       <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 bg-primary/10 rounded-full mb-6">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Recipe Management</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Create, edit, and scale your recipes with precision.
        </p>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The recipe management module is being cooked up! Soon you'll be able to manage your culinary creations with ease.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
