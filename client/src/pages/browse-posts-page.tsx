import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Heart, MapPin, Calendar, User } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { calculateAge } from "@/lib/utils";
import { MobileHeader } from "@/components/MobileHeader";
import { QuantumBottomNav } from "@/components/QuantumBottomNav";

// Import the Maldives data
const maldivesData = [
  { "Atoll": "Haa Alif", "Island": "Baarah", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Dhidhdhoo", "IsCapital": true },
  { "Atoll": "Haa Alif", "Island": "Filladhoo", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Hoarafushi", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Ihavandhoo", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Kelaa", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Molhadhoo", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Muraidhoo", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Thuraakunu", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Thakandhoo", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Utheemu", "IsCapital": false },
  { "Atoll": "Haa Alif", "Island": "Vashafaru", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Kulhudhuffushi", "IsCapital": true },
  { "Atoll": "Haa Dhaalu", "Island": "Finey", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Hanimaadhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Hirimaradhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Kumundhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Kunburudhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Maavaidhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Naivaadhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Nellaidhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Neykurendhoo", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Nolhivaaran", "IsCapital": false },
  { "Atoll": "Haa Dhaalu", "Island": "Nolhivaramu", "IsCapital": false }
];

const atolls = Array.from(new Set(maldivesData.map(item => item.Atoll)));

interface Post {
  id: number;
  title: string;
  description: string;
  relationshipType: string;
  images: string[];
  likes: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    island: string;
    atoll: string;
    profilePhotoPath?: string;
    shortBio?: string;
    dateOfBirth: string;
  };
}

export default function BrowsePostsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    atoll: "",
    island: "",
    gender: "",
    ageMin: "",
    ageMax: "",
    relationshipType: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 12;

  const searchParams = new URLSearchParams();
  if (searchQuery) searchParams.append("q", searchQuery);
  if (filters.atoll) searchParams.append("atoll", filters.atoll);
  if (filters.island) searchParams.append("island", filters.island);
  if (filters.gender) searchParams.append("gender", filters.gender);
  if (filters.ageMin) searchParams.append("ageMin", filters.ageMin);
  if (filters.ageMax) searchParams.append("ageMax", filters.ageMax);
  if (filters.relationshipType) searchParams.append("relationshipType", filters.relationshipType);
  searchParams.append("limit", limit.toString());
  searchParams.append("offset", (page * limit).toString());

  const { data, isLoading, error } = useQuery<{
    posts: Post[];
    total: number;
    hasMore: boolean;
  }>({
    queryKey: [`/api/posts/search?${searchParams.toString()}`],
  });

  const selectedAtollIslands = filters.atoll 
    ? maldivesData.filter(item => item.Atoll === filters.atoll).map(item => item.Island)
    : [];

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
  };

  const clearFilters = () => {
    setFilters({
      atoll: "",
      island: "",
      gender: "",
      ageMin: "",
      ageMax: "",
      relationshipType: ""
    });
    setSearchQuery("");
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileHeader title="Browse Posts" />
      
      <div className="container mx-auto p-4 max-w-6xl pb-20">
        <div className="flex flex-col space-y-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Posts
            </h1>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search posts by title, description, or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="bg-mint-600 hover:bg-mint-700 text-white">
            Search
          </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Atoll
                  </label>
                  <Select 
                    value={filters.atoll} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, atoll: value === "all" ? "" : value, island: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All atolls" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All atolls</SelectItem>
                      {atolls.map((atoll) => (
                        <SelectItem key={atoll} value={atoll}>
                          {atoll}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Island
                  </label>
                  <Select 
                    value={filters.island} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, island: value === "all" ? "" : value }))}
                    disabled={!filters.atoll}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All islands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All islands</SelectItem>
                      {selectedAtollIslands.map((island) => (
                        <SelectItem key={island} value={island}>
                          {island}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any gender</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Relationship Type
                  </label>
                  <Select value={filters.relationshipType} onValueChange={(value) => setFilters(prev => ({ ...prev, relationshipType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="PARTNER">Partner</SelectItem>
                      <SelectItem value="MARRIAGE">Marriage</SelectItem>
                      <SelectItem value="FRIENDSHIP">Friendship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Min Age
                  </label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={filters.ageMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                    min="18"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Age
                  </label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={filters.ageMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                    min="18"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                <Button onClick={handleSearch} className="bg-mint-600 hover:bg-mint-700 text-white">
                  Apply Filters
                </Button>
              </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <div>
            {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded mb-4 w-2/3"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}

            {error && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">
                  Failed to load posts. Please try again.
                </p>
              </CardContent>
            </Card>
            )}

            {data && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Found {data.total} posts
                </p>
                {(searchQuery || Object.values(filters).some(v => v)) && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    {searchQuery && (
                      <Badge variant="secondary">Search: "{searchQuery}"</Badge>
                    )}
                    {filters.atoll && (
                      <Badge variant="secondary">Atoll: {filters.atoll}</Badge>
                    )}
                    {filters.island && (
                      <Badge variant="secondary">Island: {filters.island}</Badge>
                    )}
                    {filters.gender && (
                      <Badge variant="secondary">Gender: {filters.gender}</Badge>
                    )}
                    {filters.relationshipType && (
                      <Badge variant="secondary">Type: {filters.relationshipType}</Badge>
                    )}
                  </div>
                )}
              </div>

              {data.posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No posts found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Try adjusting your search filters or check back later.
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.posts.map((post) => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                          {/* Image */}
                          <div className="relative h-48 bg-gradient-to-r from-mint-100 to-soft-blue-100 dark:from-mint-800 dark:to-soft-blue-800 rounded-t-lg overflow-hidden">
                            {post.images && post.images[0] ? (
                              <img
                                src={post.images[0]}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex space-x-2">
                              {post.isPinned && (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                  Pinned
                                </Badge>
                              )}
                              <Badge variant="secondary" className="capitalize">
                                {post.relationshipType?.toLowerCase() || 'general'}
                              </Badge>
                            </div>

                            {/* Likes */}
                            <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/80 dark:bg-black/80 rounded-full px-2 py-1">
                              <Heart className="w-3 h-3 text-rose-500" />
                              <span className="text-xs font-medium">{post.likes || 0}</span>
                            </div>
                          </div>

                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                              {post.title}
                            </h3>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                              {post.description}
                            </p>

                            {/* User Info */}
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={post.user.profilePhotoPath} />
                                <AvatarFallback className="text-xs">
                                  {post.user.fullName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {post.user.fullName}
                                </p>
                                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{post.user.island}</span>
                                  </div>
                                  {post.user.dateOfBirth && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{calculateAge(post.user.dateOfBirth)} yrs</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {(data.hasMore || page > 0) && (
                    <div className="flex justify-center space-x-4 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      
                      <span className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        Page {page + 1}
                      </span>
                      
                      <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!data.hasMore}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
            )}
          </div>
        </div>
      </div>
      
      <QuantumBottomNav />
    </div>
  );
}