import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function MapPage() {
  return (
    <AppLayout>
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <h1 className="text-3xl font-bold font-headline mb-2">Restaurant Map</h1>
            <p className="text-muted-foreground">
              Visualize your restaurant layout, manage tables, and track assignments in real-time.
            </p>
          </div>
          <div className="aspect-video bg-muted flex items-center justify-center">
            <Image
              src="https://placehold.co/1200x675.png"
              alt="Restaurant map placeholder"
              width={1200}
              height={675}
              className="object-cover w-full h-full"
              data-ai-hint="restaurant floor plan"
            />
          </div>
          <div className="p-6">
             <p className="text-center text-sm text-muted-foreground">Customizable map coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
