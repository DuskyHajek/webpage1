// Loading screen handling
document.addEventListener('DOMContentLoaded', function() {
    const loading = document.getElementById('loading');
    
    setTimeout(() => {
        loading.classList.add('hide');
        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
    }, 800);
    
    // Initialize after loading
    initParticles();
    setupSmoothScrolling();
    setupMenuToggle();
    setupContactForm();
    setupAnimations();
    setupLogoInteraction();
    initAICollabVisualization();
    
    // Initial update of active navigation link
    updateActiveNavLink();
    
    // Event listeners
    window.addEventListener('scroll', updateActiveNavLink);
    window.addEventListener('resize', handleResize);
});

// Create particles for the home section
function initParticles() {
    const particles = document.getElementById('particles');
    if (!particles) return;
    
    const particleCount = window.innerWidth < 768 ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 1px and 4px
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        
        // Animation timing
        particle.style.animationDelay = `${Math.random() * 30}s`;
        particle.style.animationDuration = `${Math.random() * 20 + 20}s`;
        
        // Different colors
        const colors = ['#fff', '#00d4ff', '#7700ff', '#f0f0f0'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        particles.appendChild(particle);
    }
}

// Setup smooth scrolling for anchor links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close menu if it's open
                const menu = document.getElementById('menu');
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                }
                
                // Smooth scroll
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Setup menu toggle functionality
function setupMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const menu = document.getElementById('menu');
    const menuLinks = menu.querySelectorAll('a');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => menu.classList.add('show'));
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', () => menu.classList.remove('show'));
    }
    
    // Close menu when clicking a menu link
    menuLinks.forEach(link => {
        link.addEventListener('click', () => menu.classList.remove('show'));
    });
}

// Setup contact form submission
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            // Prevent the default form submission
            event.preventDefault();
            
            // Create a new FormData object from the form
            const formData = new FormData(contactForm);
            
            // Submit the form data to Formspree using fetch
            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok.');
            })
            .then(data => {
                // Show success message
                contactForm.innerHTML = '<div class="form-success"><i class="fas fa-check-circle"></i><h3>Thank you for your message!</h3><p>I\'ll get back to you as soon as possible.</p></div>';
            })
            .catch(error => {
                // Show error message
                console.error('Error:', error);
                contactForm.innerHTML += '<div class="form-error"><i class="fas fa-exclamation-circle"></i><p>Sorry, there was a problem sending your message. Please try again or email directly to hello@duskyai.com</p></div>';
            });
        });
    }
}

// Setup animations with Intersection Observer
function setupAnimations() {
    const sections = document.querySelectorAll('.section');
    const cards = document.querySelectorAll('.project-card');
    const aiCollab = document.querySelector('.ai-collab-visual');
    
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    // Animate sections when they come into view
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
    
    // Staggered animation for project cards
    const cardObserver = new IntersectionObserver((entries) => {
        let delay = 0;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, delay);
                delay += 100; // Stagger effect
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Initialize card animations
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
        cardObserver.observe(card);
    });
    
    // Special animation for AI Collaboration Visualization
    if (aiCollab) {
        aiCollab.style.opacity = '0';
        aiCollab.style.transform = 'translateY(20px) scale(0.95)';
        aiCollab.style.transition = 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
        
        const aiCollabObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0) scale(1)';
                        
                        // Start the particle animation after the visualization appears
                        setTimeout(() => {
                            initAICollabVisualization();
                        }, 500);
                    }, 300);
                    aiCollabObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        aiCollabObserver.observe(aiCollab);
    }
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    const scrollPosition = window.scrollY;
    const sections = document.querySelectorAll('.section');
    const menuLinks = document.querySelectorAll('.menu a');
    
    // Get all sections and their positions
    const sectionPositions = Array.from(sections).map(section => {
        return {
            id: section.id,
            top: section.offsetTop - 100, // Offset for better UX
            bottom: section.offsetTop + section.offsetHeight - 100
        };
    });
    
    // Find the current section
    const currentSection = sectionPositions.find(section => 
        scrollPosition >= section.top && scrollPosition < section.bottom
    );
    
    // Remove active class from all links
    menuLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to the current section link
    if (currentSection) {
        const activeLink = document.querySelector(`a[href="#${currentSection.id}"]`);
        if (activeLink) activeLink.classList.add('active');
    }
}

// Setup logo interaction in the home section
function setupLogoInteraction() {
    // Keeping the function but removing all interactive functionality
    // This maintains the floating animation which is controlled by CSS
}

// Play a subtle sound when logo is clicked
function playLogoSound() {
    // Function emptied but kept for compatibility
}

// Check if element is in viewport
function isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

// Handle resize events
function handleResize() {
    // Recreate particles on resize for responsive design
    const particles = document.getElementById('particles');
    if (particles) {
        particles.innerHTML = '';
        initParticles();
    }
}

// Initialize the AI Collaboration Visualization
function initAICollabVisualization() {
    const container = document.querySelector('.connection-particles-container');
    if (!container) return;
    
    // Clear any existing particles
    container.innerHTML = '';
    
    // Create particles
    const particleCount = window.innerWidth < 768 ? 8 : 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('connection-particle');
        
        // Random size between 2px and 5px
        const size = Math.random() * 3 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random vertical position
        particle.style.top = `${Math.random() * 30 + 5}px`;
        
        // Animation timing
        particle.style.animationDelay = `${Math.random() * 3}s`;
        particle.style.animationDuration = `${Math.random() * 2 + 2}s`;
        
        // Different colors for particles
        const colors = ['#ffffff', '#00d4ff', '#7700ff', '#a54fff'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(particle);
    }
    
    // Add pulsing effect to the circles
    const humanCircle = document.querySelector('.human-circle');
    const aiCircle = document.querySelector('.ai-circle');
    
    if (humanCircle && aiCircle) {
        // Subtle breathing animation
        setInterval(() => {
            humanCircle.style.boxShadow = '0 0 20px rgba(119, 0, 255, 0.7)';
            setTimeout(() => {
                humanCircle.style.boxShadow = '0 0 15px rgba(119, 0, 255, 0.5)';
            }, 1000);
        }, 2000);
        
        setInterval(() => {
            aiCircle.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.7)';
            setTimeout(() => {
                aiCircle.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.5)';
            }, 1000);
        }, 2000);
    }
} 