document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica para la Interfaz de Usuario (usuario.html) ---
    const requestRideBtn = document.getElementById('requestRideBtn');
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    const priceDisplay = document.getElementById('priceDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const topUpAmountInput = document.getElementById('topUpAmount');
    const topUpBtn = document.getElementById('topUpBtn');
    const payRideBtn = document.getElementById('payRideBtn');
    const rideStatusDisplay = document.getElementById('rideStatusDisplay');

    let userBalance = parseFloat(localStorage.getItem('userBalance')) || 50.00;
    let currentRidePrice = 0;
    // Cargar el ID de la solicitud actual del usuario desde localStorage o inicializar a null
    let currentRequestId = localStorage.getItem('currentRequestId') ? parseInt(localStorage.getItem('currentRequestId')) : null;

    const updateBalanceDisplay = () => {
        if (balanceDisplay) {
            balanceDisplay.textContent = userBalance.toFixed(2);
            localStorage.setItem('userBalance', userBalance.toFixed(2));
        }
    };

    updateBalanceDisplay();

    // Lógica para manejar el estado de la solicitud del usuario al cargar la página
    const initializeUserRideStatus = () => {
        console.log('Usuario: Inicializando estado de viaje. currentRequestId:', currentRequestId);
        if (!rideStatusDisplay || !payRideBtn || !requestRideBtn) {
            console.log('Usuario: Elementos de UI no encontrados, no se puede inicializar el estado.');
            return;
        }

        if (currentRequestId) {
            const requestsOnLoad = JSON.parse(localStorage.getItem('rideRequests')) || [];
            const myActiveRequest = requestsOnLoad.find(req => req.id === currentRequestId);
            console.log('Usuario: Solicitudes al cargar:', requestsOnLoad);
            console.log('Usuario: Mi solicitud activa al cargar:', myActiveRequest);

            if (myActiveRequest) {
                if (myActiveRequest.status === 'taxistaAceptado') {
                    rideStatusDisplay.textContent = `¡Taxista encontrado! Precio: S/ ${myActiveRequest.price}. Paga para iniciar tu viaje.`;
                    rideStatusDisplay.className = 'alert alert-success mt-3';
                    payRideBtn.style.display = 'block';
                    currentRidePrice = parseFloat(myActiveRequest.price);
                    requestRideBtn.disabled = true;
                    console.log('Usuario: Estado inicial: taxistaAceptado.');
                } else if (myActiveRequest.status === 'pendiente') {
                    rideStatusDisplay.textContent = 'Tu solicitud está pendiente. Buscando taxista...';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                    requestRideBtn.disabled = true;
                    console.log('Usuario: Estado inicial: pendiente.');
                } else if (myActiveRequest.status === 'pagado') {
                    rideStatusDisplay.textContent = 'Tu último viaje fue pagado. Puedes solicitar uno nuevo.';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                    payRideBtn.style.display = 'none';
                    requestRideBtn.disabled = false;
                    localStorage.removeItem('currentRequestId'); // Limpiar ID guardado si ya fue pagado
                    currentRequestId = null;
                    console.log('Usuario: Estado inicial: pagado. currentRequestId limpiado.');
                }
            } else {
                // La solicitud asociada a currentRequestId no fue encontrada (ej. taxista la rechazó/borró)
                rideStatusDisplay.textContent = 'No tienes solicitudes de viaje activas en este momento o tu última solicitud fue cancelada. Puedes solicitar un nuevo viaje.';
                rideStatusDisplay.className = 'alert alert-warning mt-3';
                payRideBtn.style.display = 'none';
                requestRideBtn.disabled = false;
                localStorage.removeItem('currentRequestId'); // Limpiar ID guardado
                currentRequestId = null;
                console.log('Usuario: Solicitud con currentRequestId no encontrada. currentRequestId limpiado.');
            }
        } else {
            rideStatusDisplay.textContent = 'Ingresa tu origen y destino para solicitar un viaje.';
            rideStatusDisplay.className = 'alert alert-secondary mt-3';
            payRideBtn.style.display = 'none';
            requestRideBtn.disabled = false;
            console.log('Usuario: No hay currentRequestId al cargar.');
        }
    };

    initializeUserRideStatus(); // Llamar al cargar la página

    // Lógica para solicitar un viaje
    if (requestRideBtn) {
        requestRideBtn.addEventListener('click', () => {
            const origin = originInput.value.trim();
            const destination = destinationInput.value.trim();

            if (origin && destination) {
                const basePrice = 5;
                const distanceFactor = (origin.length + destination.length) * 0.5;
                currentRidePrice = (basePrice + distanceFactor).toFixed(2);

                if (priceDisplay) {
                    priceDisplay.textContent = `Precio estimado: S/ ${currentRidePrice}`;
                    priceDisplay.style.display = 'block';
                }
                if (rideStatusDisplay) {
                    rideStatusDisplay.textContent = 'Buscando taxista... Por favor, espere.';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                }
                if (payRideBtn) {
                    payRideBtn.style.display = 'none';
                }
                if (requestRideBtn) {
                    requestRideBtn.disabled = true;
                }

                const rideRequest = {
                    id: Date.now(), // Unique ID for the request
                    origin: origin,
                    destination: destination,
                    price: currentRidePrice,
                    status: 'pendiente' // Initial status
                };
                currentRequestId = rideRequest.id; // Store the current request ID
                localStorage.setItem('currentRequestId', currentRequestId); // Persist the ID in localStorage
                console.log('Usuario: Solicitud creada. currentRequestId:', currentRequestId);

                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                requests.push(rideRequest);
                localStorage.setItem('rideRequests', JSON.stringify(requests)); // Save to localStorage, will trigger 'storage' event in other tabs

                alert('Solicitud de viaje enviada. Esperando que un taxista la acepte.');

            } else {
                alert('Por favor, ingresa el origen y el destino para solicitar un viaje.');
            }
        });
    }

    // Listener for localStorage changes (CRITICAL for cross-tab communication)
    window.addEventListener('storage', (event) => {
        console.log('Usuario: Evento storage detectado.', event.key);
        // Only react if the change is to 'rideRequests' and if the user has an active request
        if (event.key === 'rideRequests' && rideStatusDisplay && payRideBtn && requestRideBtn && currentRequestId) {
            const updatedRequests = JSON.parse(event.newValue) || [];
            const myRequest = updatedRequests.find(req => req.id === currentRequestId);
            console.log('Usuario: currentRequestId en storage listener:', currentRequestId);
            console.log('Usuario: Mi solicitud en storage listener:', myRequest);

            if (myRequest) {
                if (myRequest.status === 'taxistaAceptado') {
                    rideStatusDisplay.textContent = `¡Taxista encontrado! Precio: S/ ${myRequest.price}. Paga para iniciar tu viaje.`;
                    rideStatusDisplay.className = 'alert alert-success mt-3';
                    payRideBtn.style.display = 'block';
                    currentRidePrice = parseFloat(myRequest.price); // Ensure price is correct
                    requestRideBtn.disabled = true;
                    console.log('Usuario: Solicitud actualizada a taxistaAceptado. Botón de pago visible.');
                    // alert('¡Buenas noticias! Un taxista ha aceptado tu viaje. Por favor, realiza el pago.'); // Can be annoying, optional.
                } else if (myRequest.status === 'pagado') {
                    rideStatusDisplay.textContent = 'Tu viaje está en curso o completado. ¡Gracias por usar PeruRide!';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                    payRideBtn.style.display = 'none';
                    requestRideBtn.disabled = false;
                    localStorage.removeItem('currentRequestId');
                    currentRequestId = null;
                    console.log('Usuario: Solicitud pagada. currentRequestId limpiado.');
                }
            } else {
                // If the user's request is no longer in localStorage (e.g., driver rejected it)
                if (currentRequestId) { // Only if we actually had an active request
                    rideStatusDisplay.textContent = 'Tu solicitud de viaje ha sido rechazada o cancelada. Por favor, intenta de nuevo.';
                    rideStatusDisplay.className = 'alert alert-warning mt-3';
                    payRideBtn.style.display = 'none';
                    requestRideBtn.disabled = false;
                    localStorage.removeItem('currentRequestId');
                    currentRequestId = null;
                    console.log('Usuario: Solicitud no encontrada/rechazada. currentRequestId limpiado.');
                }
            }
        }
    });

    // Lógica para recargar saldo del usuario
    if (topUpBtn) {
        topUpBtn.addEventListener('click', () => {
            const amount = parseFloat(topUpAmountInput.value);
            if (!isNaN(amount) && amount > 0) {
                userBalance += amount;
                updateBalanceDisplay();
                topUpAmountInput.value = '';
                alert(`Has recargado S/ ${amount.toFixed(2)}. Nuevo saldo: S/ ${userBalance.toFixed(2)}`);
            } else {
                alert('Por favor, ingresa una cantidad válida para recargar.');
            }
        });
    }

    // Lógica para pagar el viaje
    if (payRideBtn) {
        payRideBtn.addEventListener('click', () => {
            if (userBalance >= currentRidePrice) {
                userBalance -= currentRidePrice;
                updateBalanceDisplay();

                if (rideStatusDisplay) {
                    rideStatusDisplay.textContent = `¡Pago realizado! Viaje en curso. Saldo restante: S/ ${userBalance.toFixed(2)}`;
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                }
                if (payRideBtn) {
                    payRideBtn.style.display = 'none';
                }
                if (requestRideBtn) {
                    requestRideBtn.disabled = false; // Enable button for a new request
                }
                alert('¡Viaje pagado con éxito! El taxista ha recibido el pago.');

                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                const requestIndex = requests.findIndex(req => req.id === currentRequestId);
                if (requestIndex !== -1) {
                    requests[requestIndex].status = 'pagado';
                    localStorage.setItem('rideRequests', JSON.stringify(requests)); // This will trigger 'storage' event
                    
                    // Increase taxi driver's balance HERE, once the user has paid
                    let taxistaBalance = parseFloat(localStorage.getItem('taxistaBalance')) || 0.00;
                    taxistaBalance += parseFloat(requests[requestIndex].price);
                    localStorage.setItem('taxistaBalance', taxistaBalance.toFixed(2));
                }
                localStorage.removeItem('currentRequestId'); // Clear current request ID
                currentRequestId = null; // Reset after payment

            } else {
                alert(`Saldo insuficiente. Necesitas S/ ${currentRidePrice} y tienes S/ ${userBalance.toFixed(2)}.`);
            }
        });
    }

    // --- Lógica para la Interfaz de Taxista (taxista.html) ---
    const rideRequestsList = document.getElementById('rideRequestsList');
    const taxistaBalanceDisplay = document.getElementById('taxistaBalanceDisplay');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const withdrawBtn = document.getElementById('withdrawBtn');

    let taxistaBalance = parseFloat(localStorage.getItem('taxistaBalance')) || 0.00;

    const updateTaxistaBalanceDisplay = () => {
        if (taxistaBalanceDisplay) {
            taxistaBalanceDisplay.textContent = taxistaBalance.toFixed(2);
            localStorage.setItem('taxistaBalance', taxistaBalance.toFixed(2));
        }
    };

    updateTaxistaBalanceDisplay();

    const loadRideRequests = () => {
        if (!rideRequestsList) return;

        const requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
        rideRequestsList.innerHTML = '';

        if (requests.length === 0) {
            rideRequestsList.innerHTML = '<li class="list-group-item text-center text-muted">No hay solicitudes de viaje.</li>';
            return;
        }

        requests.forEach(request => {
            const listItem = document.createElement('li');
            let statusClass = '';
            let statusText = '';
            let actionButtons = '';

            if (request.status === 'pendiente') {
                statusClass = 'request-pending';
                statusText = 'Pendiente de aceptación';
                actionButtons = `
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-success btn-sm accept-btn" data-id="${request.id}" data-price="${request.price}">Aceptar</button>
                        <button type="button" class="btn btn-danger btn-sm reject-btn" data-id="${request.id}">Rechazar</button>
                    </div>
                `;
            } else if (request.status === 'taxistaAceptado') {
                statusClass = 'request-accepted';
                statusText = '¡Aceptado! Esperando pago del usuario';
                // No mostrar botones de acción si ya está aceptado
                actionButtons = '<span class="badge bg-info py-2 px-3"><i class="bi bi-hourglass-split me-1"></i> Esperando Pago</span>';
            }
             else if (request.status === 'pagado') {
                statusClass = 'request-accepted'; // Or a different class if desired
                statusText = 'Viaje Pagado por usuario';
                // Taxista podría tener un botón para "Completar Viaje" aquí, que luego elimine la solicitud
                actionButtons = '<span class="badge bg-success py-2 px-3"><i class="bi bi-check-circle-fill me-1"></i> Viaje Pagado</span>';
            }

            listItem.className = `list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm ${statusClass}`;
            listItem.innerHTML = `
                <div>
                    <h5>${request.origin} <i class="bi bi-arrow-right-short"></i> ${request.destination}</h5>
                    <p class="mb-1 text-muted">Precio: S/ ${request.price}</p>
                    <small class="text-info">Estado: ${statusText}</small>
                </div>
                ${actionButtons}
            `;
            rideRequestsList.appendChild(listItem);
        });

        document.querySelectorAll('.accept-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const requestId = parseInt(e.target.dataset.id);
                
                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                const requestIndex = requests.findIndex(req => req.id === requestId);

                if (requestIndex !== -1) {
                    requests[requestIndex].status = 'taxistaAceptado'; // Change status to notify user
                    localStorage.setItem('rideRequests', JSON.stringify(requests)); // This triggers the 'storage' event

                    alert(`Taxista: Has aceptado el viaje a ${requests[requestIndex].destination}. El usuario ha sido notificado para realizar el pago.`);
                    loadRideRequests(); // Reload list to update visual status on taxi driver's page
                }
            });
        });

        document.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const requestId = parseInt(e.target.dataset.id);
                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                // Filter out the rejected request to remove it from the list
                requests = requests.filter(req => req.id !== requestId);
                localStorage.setItem('rideRequests', JSON.stringify(requests));
                alert('Taxista: Has rechazado el viaje.');
                loadRideRequests();
            });
        });
    };

    if (rideRequestsList) {
        loadRideRequests();
        // Listen for storage changes to update taxi driver's request list in real-time
        window.addEventListener('storage', (event) => {
            if (event.key === 'rideRequests') {
                console.log('Taxista: Evento storage detectado. Recargando solicitudes.');
                loadRideRequests(); // Recargar la lista cuando cambien las solicitudes
            }
        });
        // SetInterval as a fallback or for new requests arriving
        setInterval(loadRideRequests, 5000);
    }

    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            const amount = parseFloat(withdrawAmountInput.value);
            if (!isNaN(amount) && amount > 0) {
                if (taxistaBalance >= amount) {
                    taxistaBalance -= amount;
                    updateTaxistaBalanceDisplay();
                    withdrawAmountInput.value = '';
                    alert(`Has retirado S/ ${amount.toFixed(2)}. Nuevo saldo: S/ ${taxistaBalance.toFixed(2)}`);
                } else {
                    alert(`Saldo insuficiente para retirar. Tienes S/ ${taxistaBalance.toFixed(2)}.`);
                }
            } else {
                alert('Por favor, ingresa una cantidad válida para retirar.');
            }
        });
    }
});
