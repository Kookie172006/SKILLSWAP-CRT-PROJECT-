// =========================
// API SETUP & URL PARAMS
// =========================
const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("skillswap-token");

// Get URL parameters (passed automatically from sessions.js when marked complete)
const urlParams = new URLSearchParams(window.location.search);
const urlSessionId = urlParams.get('sessionId');

// DOM Elements
const reviewForm = document.getElementById('reviewForm');
const ratingStars = document.querySelectorAll('.rating-star');
const reviewPartnerInput = document.getElementById('reviewPartner');
const reviewSkillInput = document.getElementById('reviewSkill');
const reviewCommentInput = document.getElementById('reviewComment');
const reviewMessage = document.getElementById('reviewMessage');
const reviewsList = document.getElementById('reviewsList');
const emptyReviews = document.getElementById('emptyReviews');
const reviewFilter = document.getElementById('reviewFilter');

let currentRating = 0;
let allReviews = [];

// =========================
// STAR RATING LOGIC
// =========================
ratingStars.forEach(star => {
    star.addEventListener('click', (e) => {
        // Remove active state from all stars
        ratingStars.forEach(s => {
            s.classList.remove('active');
            s.setAttribute('aria-pressed', 'false');
        });
        
        // Add active state up to the clicked star
        currentRating = parseInt(e.target.dataset.rating);
        for (let i = 0; i < currentRating; i++) {
            ratingStars[i].classList.add('active');
            ratingStars[i].setAttribute('aria-pressed', 'true');
        }
        
        // Clear warning message if user clicks a star
        document.getElementById('ratingHint').style.color = "inherit";
    });
});

// =========================
// FETCH & DISPLAY REVIEWS
// =========================
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`);
        const data = await response.json();
        
        if (data.success) {
            allReviews = data.reviews;
            renderReviews();
            updateStats();
        }
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}

function renderReviews() {
    reviewsList.innerHTML = "";
    const filter = reviewFilter.value;
    
    // Filter logic
    const filteredReviews = allReviews.filter(review => {
        if (filter === "All") return true;
        return review.rating === parseInt(filter);
    });

    if (filteredReviews.length === 0) {
        emptyReviews.hidden = false;
        return;
    }
    
    emptyReviews.hidden = true;

    filteredReviews.forEach(review => {
        const card = document.createElement('article');
        card.className = 'review-card';
        
        // Convert number rating to star string (e.g. 4 -> "★★★★☆")
        const filledStars = '★'.repeat(review.rating);
        const emptyStars = '☆'.repeat(5 - review.rating);
        
        // Format Date
        const reviewDate = new Date(review.createdAt).toLocaleDateString(undefined, { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });

        card.innerHTML = `
            <div class="review-header">
                <div>
                    <h3 class="reviewer-name">Community Member</h3>
                    <div class="review-rating" aria-label="${review.rating} out of 5 stars">
                        filledStars{emptyStars}
                    </div>
                </div>
                <span class="review-date">${reviewDate}</span>
            </div>
            <p class="review-text">${review.comment || 'No comment provided.'}</p>
        `;
        
        reviewsList.appendChild(card);
    });
}

function updateStats() {
    if (allReviews.length === 0) return;
    
    // Total Reviews
    document.getElementById('totalReviews').textContent = allReviews.length;
    
    // Average Rating
    const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = (sum / allReviews.length).toFixed(1);
    document.getElementById('averageRating').textContent = avg;
    
    // Visual Average Stars
    const roundedAvg = Math.round(avg);
    document.getElementById('averageStars').textContent = '★'.repeat(roundedAvg) + '☆'.repeat(5 - roundedAvg);
}

// Re-render when dropdown changes
reviewFilter.addEventListener('change', renderReviews);

// =========================
// SUBMIT REVIEW
// =========================
reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!token) {
        showFeedback("Please log in to submit a review.", true);
        return;
    }
    
    if (!urlSessionId) {
        showFeedback("Reviews must be submitted directly from a completed calendar session.", true);
        return;
    }

    if (currentRating === 0) {
        document.getElementById('ratingHint').style.color = "#d94848";
        return;
    }

    const payload = {
        sessionId: urlSessionId,
        rating: currentRating,
        comment: reviewCommentInput.value.trim()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok || data.success) {
            showFeedback("Review submitted successfully! Thank you.", false);
            
            // Reset Form UI
            reviewForm.reset();
            currentRating = 0;
            ratingStars.forEach(s => {
                s.classList.remove('active');
                s.setAttribute('aria-pressed', 'false');
            });
            
            loadReviews(); // Refresh the list
        } else {
            // Usually hits if the session isn't marked complete or they already reviewed it
            showFeedback(data.message || "Failed to submit review.", true);
        }
    } catch (error) {
        showFeedback("Network error. Please try again.", true);
    }
});

function showFeedback(message, isError) {
    reviewMessage.textContent = message;
    reviewMessage.style.color = isError ? "#d94848" : "var(--primary)";
}

// Start Script
loadReviews();