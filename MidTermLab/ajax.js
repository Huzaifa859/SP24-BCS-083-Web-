$(document).ready(function () {
    const $dealsContainer = $('#featured-deals');
    const $modal = $('#quick-view-modal');

    // 1. AJAX Call to fetch product data
    $.ajax({
        url: 'https://fakestoreapi.com/products?limit=4',
        method: 'GET',
        dataType: 'json',
        success: function (products) {
            // 2. DOM Manipulation: Clear the container first
            $dealsContainer.empty();

            // Loop through data and build cards
            products.forEach(product => {
                // Sanitize text for data attributes to prevent HTML breaking
                const safeTitle = product.title.replace(/"/g, '&quot;');
                const safeDesc = product.description.replace(/"/g, '&quot;');

                const cardHTML = `
                    <div class="deal-card">
                        <img src="${product.image}" alt="${product.title}">
                        <h3>${product.title}</h3>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        
                        <button class="quick-view-btn" 
                            data-img="${product.image}"
                            data-title="${safeTitle}"
                            data-price="${product.price.toFixed(2)}"
                            data-rating="${product.rating.rate} / 5 (${product.rating.count} reviews)"
                            data-desc="${safeDesc}">
                            Quick View
                        </button>
                    </div>
                `;
                
                // Inject into DOM
                $dealsContainer.append(cardHTML);
            });

            // 4. Bind Modal events to the NEWLY created buttons
            bindModalEvents();
        },
        error: function (err) {
            $dealsContainer.html('<p style="text-align: center; width: 100%;">Failed to load deals. Please try again later.</p>');
            console.error("Error fetching data: ", err);
        }
    });

    // Function to handle opening and closing the modal
    function bindModalEvents() {
        $('.quick-view-btn').on('click', function () {
            const $btn = $(this);

            // Populate modal with button's data attributes
            $('#modal-img').attr('src', $btn.data('img'));
            $('#modal-title').text($btn.data('title'));
            $('#modal-price').text('$' + $btn.data('price'));
            $('#modal-rating').text('★ ' + $btn.data('rating'));
            $('#modal-desc').text($btn.data('desc'));

            // Show the modal
            $modal.css('display', 'flex');
        });
    }

    // Close Modal when 'X' is clicked
    $('.close-btn').on('click', function () {
        $modal.css('display', 'none');
    });

    // Close Modal when clicking outside the content box
    $(window).on('click', function (event) {
        if ($(event.target).is($modal)) {
            $modal.css('display', 'none');
        }
    });
});