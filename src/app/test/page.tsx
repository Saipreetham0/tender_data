// "use client";
// import React, { useState,  } from "react";
// import {
//   Search,
//   Filter,
//   Bell,
//   Download,
//   Calendar,
//   Clock,
//   Building2,
//   ExternalLink,
//   Loader2,
//   RefreshCw,
//   User,
//   Settings,
//   LogOut,
//   Crown,
//   Mail,
//   Menu,
//   X,
//   AlertCircle,
//   CheckCircle,
//   Zap,
//   Shield,
//   ChevronDown
// } from "lucide-react";

// // Mock data - replace with real Supabase data
// const mockUser = {
//   id: "user_123",
//   email: "john.doe@example.com",
//   profile: {
//     full_name: "John Doe",
//     avatar_url: null
//   }
// };

// const mockTenders = [
//   {
//     id: 1,
//     name: "Supply of Laboratory Equipment for Engineering Department",
//     postedDate: "2024-01-15",
//     closingDate: "2024-02-15",
//     source: "RGUKT Basar",
//     downloadLinks: [
//       { text: "Detailed Notification", url: "#" },
//       { text: "Technical Specifications", url: "#" }
//     ],
//     isUrgent: true
//   },
//   {
//     id: 2,
//     name: "Construction of New Academic Block - Phase 2",
//     postedDate: "2024-01-14",
//     closingDate: "2024-02-20",
//     source: "RGUKT Ongole",
//     downloadLinks: [
//       { text: "Tender Document", url: "#" },
//       { text: "Site Plan", url: "#" }
//     ],
//     isUrgent: false
//   },
//   {
//     id: 3,
//     name: "Annual Maintenance Contract for Computer Systems",
//     postedDate: "2024-01-13",
//     closingDate: "2024-01-30",
//     source: "RGUKT RK Valley",
//     downloadLinks: [
//       { text: "Detailed Notification", url: "#" }
//     ],
//     isUrgent: true
//   }
// ];

// const campuses = [
//   { id: "all", name: "All Campuses", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
//   { id: "basar", name: "RGUKT Basar", color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
//   { id: "ongole", name: "RGUKT Ongole", color: "bg-gradient-to-r from-green-500 to-emerald-500" },
//   { id: "rkvalley", name: "RGUKT RK Valley", color: "bg-gradient-to-r from-orange-500 to-red-500" },
//   { id: "sklm", name: "RGUKT Srikakulam", color: "bg-gradient-to-r from-indigo-500 to-purple-500" }
// ];

// // UserAvatar Component
// const UserAvatar = ({ user, size = 'sm' }) => {
//   const sizeClasses = {
//     sm: 'w-8 h-8',
//     md: 'w-10 h-10',
//     lg: 'w-12 h-12'
//   };

//   const textSizes = {
//     sm: 'text-xs',
//     md: 'text-sm',
//     lg: 'text-lg'
//   };

//   const getInitials = (user) => {
//     if (user.profile?.full_name) {
//       return user.profile.full_name
//         .split(' ')
//         .map(name => name[0])
//         .join('')
//         .toUpperCase()
//         .slice(0, 2);
//     }
//     return user.email?.charAt(0).toUpperCase() || 'U';
//   };

//   const getAvatarColor = (email) => {
//     const colors = [
//       'from-blue-500 to-indigo-600',
//       'from-purple-500 to-pink-600',
//       'from-emerald-500 to-teal-600',
//       'from-orange-500 to-red-600'
//     ];
//     const hash = email?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
//     return colors[hash % colors.length];
//   };

//   if (user.profile?.avatar_url) {
//     return (
//       <img
//         src={user.profile.avatar_url}
//         alt="Profile"
//         className={`${sizeClasses[size]} rounded-full border-2 border-white shadow-sm object-cover`}
//       />
//     );
//   }

//   return (
//     <div
//       className={`${sizeClasses[size]} bg-gradient-to-br ${getAvatarColor(user.email)} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}
//     >
//       <span className={`text-white font-semibold ${textSizes[size]}`}>
//         {getInitials(user)}
//       </span>
//     </div>
//   );
// };

// // Navbar Component
// const Navbar = ({ user, onMenuClick }) => {
//   const [showUserMenu, setShowUserMenu] = useState(false);

//   return (
//     <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex items-center">
//             <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 md:hidden">
//               <Menu className="h-5 w-5" />
//             </button>
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <Building2 className="h-6 w-6 text-white" />
//               </div>
//               <div className="hidden sm:block">
//                 <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                   RGUKT Tenders
//                 </h1>
//               </div>
//             </div>
//           </div>

//           {/* Right side */}
//           <div className="flex items-center space-x-4">
//             {/* Notifications */}
//             <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
//               <Bell className="h-5 w-5 text-gray-600" />
//               <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
//             </button>

//             {/* User Menu */}
//             {user ? (
//               <div className="relative">
//                 <button
//                   onClick={() => setShowUserMenu(!showUserMenu)}
//                   className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   <UserAvatar user={user} size="sm" />
//                   <div className="hidden sm:block text-left">
//                     <p className="text-sm font-medium text-gray-700">
//                       {user.profile?.full_name || user.email?.split('@')[0]}
//                     </p>
//                     <p className="text-xs text-gray-500">Pro Plan</p>
//                   </div>
//                   <ChevronDown className="h-4 w-4 text-gray-400" />
//                 </button>

//                 {showUserMenu && (
//                   <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
//                     <div className="px-4 py-3 border-b border-gray-100">
//                       <div className="flex items-center space-x-3">
//                         <UserAvatar user={user} size="lg" />
//                         <div>
//                           <p className="font-medium text-gray-900">
//                             {user.profile?.full_name || 'User'}
//                           </p>
//                           <p className="text-sm text-gray-500">{user.email}</p>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="py-2">
//                       <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
//                         <User className="h-4 w-4" />
//                         <span>Profile</span>
//                       </button>
//                       <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
//                         <Crown className="h-4 w-4" />
//                         <span>Subscription</span>
//                       </button>
//                       <button className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
//                         <Settings className="h-4 w-4" />
//                         <span>Settings</span>
//                       </button>
//                       <hr className="my-2" />
//                       <button className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
//                         <LogOut className="h-4 w-4" />
//                         <span>Sign Out</span>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="flex items-center space-x-2">
//                 <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
//                   Sign In
//                 </button>
//                 <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all">
//                   Get Started
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// // Sidebar Component
// const Sidebar = ({ isOpen, onClose, selectedCampus, onCampusChange }) => {
//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClose} />
//       )}

//       {/* Sidebar */}
//       <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
//         isOpen ? 'translate-x-0' : '-translate-x-full'
//       } md:translate-x-0 md:static md:w-64 md:shadow-none md:border-r md:border-gray-200`}>

//         {/* Mobile header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
//           <h2 className="text-lg font-semibold">Menu</h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         <div className="p-6">
//           {/* Campus Filter */}
//           <div className="mb-8">
//             <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
//               Select Campus
//             </h3>
//             <div className="space-y-2">
//               {campuses.map((campus) => (
//                 <button
//                   key={campus.id}
//                   onClick={() => onCampusChange(campus.id)}
//                   className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
//                     selectedCampus === campus.id
//                       ? 'bg-blue-50 border border-blue-200 text-blue-700'
//                       : 'hover:bg-gray-50 text-gray-700'
//                   }`}
//                 >
//                   <div className={`w-3 h-3 rounded-full ${campus.color}`}></div>
//                   <span className="font-medium">{campus.name}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Quick Stats */}
//           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
//             <h4 className="font-semibold text-gray-900 mb-3">Today's Summary</h4>
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-sm text-gray-600">Active Tenders</span>
//                 <span className="font-semibold text-blue-600">12</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-sm text-gray-600">Closing Soon</span>
//                 <span className="font-semibold text-orange-600">3</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-sm text-gray-600">New Today</span>
//                 <span className="font-semibold text-green-600">2</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// // Search and Filter Bar
// const SearchFilterBar = ({ searchTerm, onSearchChange, onRefresh, isRefreshing }) => {
//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//       <div className="flex flex-col sm:flex-row gap-4">
//         {/* Search */}
//         <div className="flex-1 relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search tenders..."
//             value={searchTerm}
//             onChange={(e) => onSearchChange(e.target.value)}
//             className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//           />
//         </div>

//         {/* Filter and Refresh */}
//         <div className="flex items-center space-x-3">
//           <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//             <Filter className="h-5 w-5 text-gray-500" />
//             <span className="text-gray-700 font-medium">Filter</span>
//           </button>

//           <button
//             onClick={onRefresh}
//             disabled={isRefreshing}
//             className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
//           >
//             <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
//             <span className="font-medium">Refresh</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Tender Card Component
// const TenderCard = ({ tender }) => {
//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   const isClosingSoon = (closingDate) => {
//     const today = new Date();
//     const closing = new Date(closingDate);
//     const diffTime = closing - today;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays <= 7 && diffDays >= 0;
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-300">
//       <div className="p-6">
//         {/* Header */}
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex-1">
//             <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-relaxed">
//               {tender.name}
//             </h3>
//             <div className="flex items-center space-x-4 text-sm text-gray-500">
//               <div className="flex items-center space-x-1">
//                 <Building2 className="h-4 w-4" />
//                 <span>{tender.source}</span>
//               </div>
//             </div>
//           </div>

//           {tender.isUrgent && (
//             <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
//               <AlertCircle className="h-4 w-4" />
//               <span>Urgent</span>
//             </div>
//           )}
//         </div>

//         {/* Dates */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <div className="flex items-center space-x-2">
//             <Calendar className="h-4 w-4 text-green-600" />
//             <div>
//               <p className="text-xs text-gray-500">Posted</p>
//               <p className="text-sm font-medium text-gray-900">{formatDate(tender.postedDate)}</p>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             <Clock className={`h-4 w-4 ${isClosingSoon(tender.closingDate) ? 'text-orange-600' : 'text-blue-600'}`} />
//             <div>
//               <p className="text-xs text-gray-500">Closes</p>
//               <p className={`text-sm font-medium ${
//                 isClosingSoon(tender.closingDate) ? 'text-orange-600' : 'text-gray-900'
//               }`}>
//                 {formatDate(tender.closingDate)}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Download Links */}
//         <div className="flex flex-wrap gap-2">
//           {tender.downloadLinks.map((link, index) => (
//             <button
//               key={index}
//               className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
//             >
//               <Download className="h-4 w-4" />
//               <span>{link.text}</span>
//               <ExternalLink className="h-3 w-3" />
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Main Dashboard Component
// const TenderDashboard = () => {
//   const [user] = useState(mockUser);
//   const [tenders] = useState(mockTenders);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCampus, setSelectedCampus] = useState('all');
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Filter tenders based on search and campus
//   const filteredTenders = tenders.filter(tender => {
//     const matchesSearch = tender.name.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesCampus = selectedCampus === 'all' || tender.source.toLowerCase().includes(selectedCampus);
//     return matchesSearch && matchesCampus;
//   });

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     // Simulate API call
//     await new Promise(resolve => setTimeout(resolve, 1500));
//     setIsRefreshing(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />

//       <div className="flex">
//         <Sidebar
//           isOpen={sidebarOpen}
//           onClose={() => setSidebarOpen(false)}
//           selectedCampus={selectedCampus}
//           onCampusChange={setSelectedCampus}
//         />

//         {/* Main Content */}
//         <div className="flex-1 p-6">
//           <div className="max-w-7xl mx-auto">
//             {/* Page Header */}
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900 mb-2">
//                 Tender Dashboard
//               </h1>
//               <p className="text-gray-600">
//                 Discover and track the latest tenders from RGUKT campuses
//               </p>
//             </div>

//             <SearchFilterBar
//               searchTerm={searchTerm}
//               onSearchChange={setSearchTerm}
//               onRefresh={handleRefresh}
//               isRefreshing={isRefreshing}
//             />

//             {/* Results */}
//             <div className="mb-6">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold text-gray-900">
//                   {filteredTenders.length} Tender{filteredTenders.length !== 1 ? 's' : ''} Found
//                 </h2>
//                 <div className="flex items-center space-x-2 text-sm text-gray-500">
//                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                   <span>Live updates</span>
//                 </div>
//               </div>
//             </div>

//             {/* Tender Grid */}
//             {loading ? (
//               <div className="flex justify-center items-center h-64">
//                 <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//               </div>
//             ) : (
//               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//                 {filteredTenders.map((tender) => (
//                   <TenderCard key={tender.id} tender={tender} />
//                 ))}
//               </div>
//             )}

//             {filteredTenders.length === 0 && !loading && (
//               <div className="text-center py-12">
//                 <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
//                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <Search className="h-8 w-8 text-gray-400" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenders found</h3>
//                   <p className="text-gray-600">
//                     Try adjusting your search criteria or check back later for new tenders.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TenderDashboard;



