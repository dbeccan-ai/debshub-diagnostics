import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const tests = [
    {
      id: "observation",
      name: "Observation Quiz",
      description: "Test your observation and attention to detail",
      duration: 45,
      price: 0,
      isFree: true,
      features: ["Quick assessment", "Instant feedback", "No payment required"]
    },
    {
      id: "math",
      name: "Math Diagnostic Test",
      description: "Comprehensive mathematics skills assessment",
      duration: 90,
      price: 5,
      isFree: false,
      features: ["Detailed analysis", "Tier placement", "Certificate included"]
    },
    {
      id: "ela",
      name: "ELA Diagnostic Test",
      description: "English Language Arts proficiency evaluation",
      duration: 90,
      price: 5,
      isFree: false,
      features: ["Reading & writing skills", "Tier placement", "Certificate included"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            DEBs Diagnostic Hub
          </h1>
          <Button onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Discover Your Learning Path
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take diagnostic tests to identify your strengths and areas for improvement. 
            Get personalized feedback and certificates.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {tests.map((test) => (
            <Card key={test.id} className="flex flex-col hover:shadow-xl transition-all duration-300 border-2">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl">{test.name}</CardTitle>
                  {test.isFree ? (
                    <Badge className="bg-green-500">FREE</Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {test.price}
                    </Badge>
                  )}
                </div>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{test.duration} minutes</span>
                  </div>
                  <ul className="space-y-2">
                    {test.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ready to Begin?</CardTitle>
              <CardDescription className="text-blue-100">
                Create your free account and start your first diagnostic test today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t mt-16 py-8 bg-white">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 DEBs Diagnostic Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
