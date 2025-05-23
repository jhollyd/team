import { useState, useEffect, useRef } from 'react';
import { Menu, X, CircleUserRound } from 'lucide-react';
import { useUser, useClerk, SignInButton } from '@clerk/clerk-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import CartDropdown from './CartDropdown';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileClicked, setIsProfileClicked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();

  // To correctly display the background color of the navbar on non-home pages
  const isNonHomePage = location.pathname.startsWith('/gallery') || 
    location.pathname.startsWith('/product') || 
    location.pathname.startsWith('/account') || 
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/admin');

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/clerk/${user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const data = await response.json();
          setIsAdmin(data.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileClicked(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileClicked(false);
  };

  const scrollToSection = (sectionId: string) => {
    navigate('/', { state: { scrollTo: sectionId } });
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : isNonHomePage ? 'bg-gray-900' : 'bg-transparent'
      }`}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className={`text-xl font-bold hover:text-blue-200 transition-colors ${
              isScrolled ? 'text-black' : 'text-white'
            }`}>
              MANDALA
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8 text-xl">
              <button
                onClick={() => scrollToSection('about')}
                className={`font-bold hover:text-blue-200 transition-colors ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('gallery')}
                className={`font-bold hover:text-blue-200 transition-colors ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                Gallery
              </button>
              <a
                href="/gallery"
                className={`font-bold hover:text-blue-200 transition-colors ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                Shop
              </a>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`font-bold hover:text-blue-200 transition-colors ${
                    isScrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}

              <div className="relative" ref={dropdownRef}>
                {isSignedIn ? (
                  <>
                    <button
                      className={`relative hover:text-blue-200 transition-colors ${
                        isScrolled ? 'text-black' : 'text-white'
                      }`}
                      onClick={() => setIsProfileClicked(!isProfileClicked)}
                    >
                      <CircleUserRound size={30} />
                    </button>
                    {isProfileClicked && (
                      <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg min-w-max z-50 text-lg">
                        <div className="absolute -top-2 right-2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>
                        <div className="px-4 py-2 border-b">
                          <p className="font-medium text-gray-900">
                            {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                          </p>
                        </div>
                        <ul className="py-2 text-gray-500">
                          <li className="px-4 py-2 hover:bg-gray-100">
                            <button
                              onClick={() => {
                                setIsProfileClicked(false);
                                navigate('/account');
                              }}
                              className="w-full text-left"
                            >
                              Account Management
                            </button>
                          </li>
                          <li className="px-4 py-2 hover:bg-gray-100">
                            <a href="#">Order History</a>
                          </li>
                          <li className="px-4 py-2 hover:bg-gray-100">
                            <button onClick={handleSignOut} className="text-left w-full">
                              Sign Out
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      className={`relative hover:text-blue-200 transition-colors ${
                        isScrolled ? 'text-black' : 'text-white'
                      }`}
                    >
                      <CircleUserRound size={30} />
                    </button>
                  </SignInButton>
                )}
              </div>

              <CartDropdown />
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`hover:text-red-600 transition-colors ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-3 py-2 text-black font-bold hover:text-red-600"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('gallery')}
              className="block w-full text-left px-3 py-2 text-black font-bold hover:text-red-600"
            >
              Gallery
            </button>
            <a
              href="/gallery"
              className="block px-3 py-2 text-black font-bold hover:text-red-600"
            >
              Product
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 bg-red-600 text-white font-bold rounded-md"
            >
              Contact Us
            </a>
            {isSignedIn ? (
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 text-black font-bold hover:text-red-600"
              >
                Sign Out
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="block w-full text-left px-3 py-2 text-black font-bold hover:text-red-600">
                  Sign In
                </button>
              </SignInButton>
            )}
            <CartDropdown />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
