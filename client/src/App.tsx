import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { JoinWaitlistInput, WaitlistConfirmation } from '../../server/src/schema';

function App() {
  const [formData, setFormData] = useState<JoinWaitlistInput>({
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<WaitlistConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await trpc.joinWaitlist.mutate(formData);
      setConfirmation(response);
      
      // Reset form on success
      if (response.success) {
        setFormData({ name: '', email: '' });
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConfirmation(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🚀 Join Our Waitlist
            </CardTitle>
            <CardDescription className="text-gray-600">
              Be the first to know when we launch! Sign up to get exclusive early access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {confirmation && confirmation.success ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    ✅ {confirmation.message}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  className="w-full"
                >
                  Join Another Person
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      ❌ {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {confirmation && !confirmation.success && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription className="text-yellow-800">
                      ⚠️ {confirmation.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: JoinWaitlistInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: JoinWaitlistInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || !formData.name.trim() || !formData.email.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining Waitlist...
                    </>
                  ) : (
                    'Join Waitlist 🎉'
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  We'll never spam you. Unsubscribe at any time.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            💡 Join thousands of others waiting for something amazing
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;