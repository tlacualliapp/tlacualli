import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Image from 'next/image';

const menuItems = [
  { name: 'Volcano Tacos', description: 'Spicy chorizo, melted cheese, and fresh salsa in a crispy shell.', price: '$12.50', image: 'https://placehold.co/400x300.png', hint: 'tacos' },
  { name: 'Aztec Burger', description: 'Angus beef patty, avocado, jalapeños, and chipotle mayo.', price: '$15.00', image: 'https://placehold.co/400x300.png', hint: 'burger' },
  { name: 'Quinoa Sun Salad', description: 'A vibrant mix of quinoa, black beans, corn, and citrus dressing.', price: '$11.00', image: 'https://placehold.co/400x300.png', hint: 'salad' },
  { name: 'Churros & Chocolate', description: 'Classic churros served with a rich, dark chocolate dipping sauce.', price: '$8.50', image: 'https://placehold.co/400x300.png', hint: 'churros dessert' },
];

export default function MenuPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Menu Customization</h1>
          <p className="text-muted-foreground">Manage your categories, items, and recipes.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {menuItems.map(item => (
          <Card key={item.name} className="overflow-hidden flex flex-col">
            <CardHeader className="p-0">
              <Image src={item.image} alt={item.name} width={400} height={300} className="w-full h-48 object-cover" data-ai-hint={item.hint} />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <CardTitle className="font-headline text-lg mb-1">{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
              <span className="font-bold text-lg text-primary">{item.price}</span>
              <Button variant="outline">Edit</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
