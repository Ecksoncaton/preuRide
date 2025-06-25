document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica para la Interfaz de Usuario (usuario.html) ---
    const requestRideBtn = document.getElementById('requestRideBtn');
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    const serviceTypeSelect = document.getElementById('serviceType');
    const priceDisplay = document.getElementById('priceDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const topUpAmountInput = document.getElementById('topUpAmount');
    const topUpBtn = document.getElementById('topUpBtn');
    const payRideBtn = document.getElementById('payRideBtn');
    const rideStatusDisplay = document.getElementById('rideStatusDisplay');
    const userTripHistoryList = document.getElementById('userTripHistoryList'); // NUEVO: Elemento para el historial de viajes

    // Definición de los tipos de servicio con sus tarifas (base y por km)
    const SERVICE_TYPES = {
        'Economico': { baseFare: 5.00, pricePerKm: 1.00 },
        'Standard': { baseFare: 7.00, pricePerKm: 1.20 },
        'Premium': { baseFare: 10.00, pricePerKm: 1.50 }
    };

    // Función para simular una distancia en kilómetros
    const simulateDistance = () => {
        // Genera una distancia aleatoria entre 5 y 25 km para simulación
        return (Math.random() * 20 + 5).toFixed(1);
    };

    let userBalance = parseFloat(localStorage.getItem('userBalance')) || 50.00;
    let currentRidePrice = 0;
    let currentRequestId = localStorage.getItem('currentRequestId') ? parseInt(localStorage.getItem('currentRequestId')) : null;
    // NUEVO: Historial de viajes del usuario
    let userTripHistory = JSON.parse(localStorage.getItem('userTripHistory')) || [];

    // Función para actualizar el saldo en la UI y en localStorage
    const updateBalanceDisplay = () => {
        if (balanceDisplay) {
            balanceDisplay.textContent = userBalance.toFixed(2);
            localStorage.setItem('userBalance', userBalance.toFixed(2));
        }
    };

    // NUEVO: Función para actualizar el historial de viajes del usuario en la UI
    const updateUserTripHistoryDisplay = () => {
        if (userTripHistoryList) {
            userTripHistoryList.innerHTML = ''; // Clear current list

            if (userTripHistory.length === 0) {
                userTripHistoryList.innerHTML = '<li class="list-group-item text-center text-muted">No hay viajes registrados.</li>';
                return;
            }

            // Reverse to show most recent trips first
            userTripHistory.slice().reverse().forEach(trip => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    <div>
                        <strong>${trip.origin} <i class="bi bi-arrow-right-short"></i> ${trip.destination}</strong><br>
                        <small>Servicio: ${trip.serviceType} | Distancia: ${trip.distance} km</small><br>
                        <small>Precio: S/ ${trip.price} | Fecha: ${new Date(trip.timestamp).toLocaleString()}</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">S/ ${trip.price}</span>
                `;
                userTripHistoryList.appendChild(listItem);
            });
            localStorage.setItem('userTripHistory', JSON.stringify(userTripHistory)); // Save to localStorage
        }
    };

    updateBalanceDisplay();
    updateUserTripHistoryDisplay(); // Initialize user trip history display

    const initializeUserRideStatus = () => {
        if (!rideStatusDisplay || !payRideBtn || !requestRideBtn) {
            return;
        }

        if (currentRequestId) {
            const requestsOnLoad = JSON.parse(localStorage.getItem('rideRequests')) || [];
            const myActiveRequest = requestsOnLoad.find(req => req.id === currentRequestId);

            if (myActiveRequest) {
                if (myActiveRequest.status === 'taxistaAceptado') {
                    rideStatusDisplay.textContent = `¡Taxista encontrado! Precio: S/ ${myActiveRequest.price} (${myActiveRequest.serviceType} - ${myActiveRequest.distance} km). Paga para iniciar tu viaje.`;
                    rideStatusDisplay.className = 'alert alert-success mt-3';
                    payRideBtn.style.display = 'block';
                    currentRidePrice = parseFloat(myActiveRequest.price);
                    requestRideBtn.disabled = true;
                    if (serviceTypeSelect) serviceTypeSelect.disabled = true;
                } else if (myActiveRequest.status === 'pendiente') {
                    rideStatusDisplay.textContent = 'Tu solicitud está pendiente. Buscando taxista...';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                    requestRideBtn.disabled = true;
                    if (serviceTypeSelect) serviceTypeSelect.disabled = true;
                } else if (myActiveRequest.status === 'pagado') {
                    rideStatusDisplay.textContent = 'Tu último viaje fue pagado. Puedes solicitar uno nuevo.';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                    payRideBtn.style.display = 'none';
                    requestRideBtn.disabled = false;
                    if (serviceTypeSelect) serviceTypeSelect.disabled = false;
                    localStorage.removeItem('currentRequestId');
                    currentRequestId = null;
                    // When status is 'pagado' on load, means it was already processed
                    // This prevents re-adding to history if page is refreshed after payment
                }
            } else {
                rideStatusDisplay.textContent = 'No tienes solicitudes de viaje activas en este momento o tu última solicitud fue cancelada. Puedes solicitar un nuevo viaje.';
                rideStatusDisplay.className = 'alert alert-warning mt-3';
                payRideBtn.style.display = 'none';
                requestRideBtn.disabled = false;
                if (serviceTypeSelect) serviceTypeSelect.disabled = false;
                localStorage.removeItem('currentRequestId');
                currentRequestId = null;
            }
        } else {
            rideStatusDisplay.textContent = 'Ingresa tu origen y destino para solicitar un viaje.';
            rideStatusDisplay.className = 'alert alert-secondary mt-3';
            payRideBtn.style.display = 'none';
            requestRideBtn.disabled = false;
            if (serviceTypeSelect) serviceTypeSelect.disabled = false;
        }
    };

    initializeUserRideStatus();

    if (requestRideBtn) {
        requestRideBtn.addEventListener('click', () => {
            const origin = originInput.value.trim();
            const destination = destinationInput.value.trim();
            const selectedServiceType = serviceTypeSelect ? serviceTypeSelect.value : 'Standard';

            if (origin && destination) {
                const serviceConfig = SERVICE_TYPES[selectedServiceType];
                const simulatedDistance = simulateDistance();

                currentRidePrice = (serviceConfig.baseFare + (simulatedDistance * serviceConfig.pricePerKm)).toFixed(2);

                if (priceDisplay) {
                    priceDisplay.textContent = `Precio estimado: S/ ${currentRidePrice} (${selectedServiceType} - ${simulatedDistance} km)`;
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
                if (serviceTypeSelect) {
                    serviceTypeSelect.disabled = true;
                }

                const rideRequest = {
                    id: Date.now(),
                    origin: origin,
                    destination: destination,
                    serviceType: selectedServiceType,
                    distance: simulatedDistance,
                    price: currentRidePrice,
                    status: 'pendiente',
                    timestamp: Date.now() // Add timestamp for history
                };
                currentRequestId = rideRequest.id;
                localStorage.setItem('currentRequestId', currentRequestId);

                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                requests.push(rideRequest);
                localStorage.setItem('rideRequests', JSON.stringify(requests));

                alert('Solicitud de viaje enviada. Esperando que un taxista la acepte.');

            } else {
                alert('Por favor, ingresa el origen y el destino para solicitar un viaje.');
            }
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'rideRequests' && rideStatusDisplay && payRideBtn && requestRideBtn && currentRequestId) {
            const updatedRequests = JSON.parse(event.newValue) || [];
            const myRequest = updatedRequests.find(req => req.id === currentRequestId);

            if (myRequest) {
                if (myRequest.status === 'taxistaAceptado') {
                    rideStatusDisplay.textContent = `¡Taxista encontrado! Precio: S/ ${myRequest.price} (${myRequest.serviceType} - ${myRequest.distance} km). Paga para iniciar tu viaje.`;
                    rideStatusDisplay.className = 'alert alert-success mt-3';
                    payRideBtn.style.display = 'block';
                    currentRidePrice = parseFloat(myRequest.price);
                    requestRideBtn.disabled = true;
                    if (serviceTypeSelect) serviceTypeSelect.disabled = true;
                } else if (myRequest.status === 'pagado') {
                    // This path is for when the user page refreshes or opens after payment was already done
                    rideStatusDisplay.textContent = 'Tu viaje está en curso o completado. ¡Gracias por usar PeruRide!';
                    rideStatusDisplay.className = 'alert alert-info mt-3';
                    payRideBtn.style.display = 'none';
                    requestRideBtn.disabled = false;
                    if (serviceTypeSelect) serviceTypeSelect.disabled = false;
                    // Add trip to history if not already there (check by ID)
                    if (!userTripHistory.some(trip => trip.id === myRequest.id)) {
                        userTripHistory.push(myRequest);
                        updateUserTripHistoryDisplay();
                    }
                    localStorage.removeItem('currentRequestId');
                    currentRequestId = null;
                }
            } else {
                if (currentRequestId) {
                    rideStatusDisplay.textContent = 'Tu solicitud de viaje ha sido rechazada o cancelada. Por favor, intenta de nuevo.';
                    rideStatusDisplay.className = 'alert alert-warning mt-3';
                    payRideBtn.style.display = 'none';
                    requestRideBtn.disabled = false;
                    if (serviceTypeSelect) serviceTypeSelect.disabled = false;
                    localStorage.removeItem('currentRequestId');
                    currentRequestId = null;
                }
            }
        }
    });

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
                    requestRideBtn.disabled = false;
                }
                if (serviceTypeSelect) serviceTypeSelect.disabled = false;
                alert('¡Viaje pagado con éxito! El taxista ha recibido el pago.');

                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                const requestIndex = requests.findIndex(req => req.id === currentRequestId);
                if (requestIndex !== -1) {
                    const completedTrip = requests[requestIndex];
                    completedTrip.status = 'pagado';
                    localStorage.setItem('rideRequests', JSON.stringify(requests));
                    
                    // Add completed trip to user's history
                    userTripHistory.push(completedTrip);
                    updateUserTripHistoryDisplay();
                    
                    let taxistaBalance = parseFloat(localStorage.getItem('taxistaBalance')) || 0.00;
                    taxistaBalance += parseFloat(completedTrip.price);
                    localStorage.setItem('taxistaBalance', taxistaBalance.toFixed(2));
                }
                localStorage.removeItem('currentRequestId');
                currentRequestId = null;

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
    const taxistaWithdrawalHistoryList = document.getElementById('taxistaWithdrawalHistoryList'); // NUEVO: Elemento para el historial de retiros

    let taxistaBalance = parseFloat(localStorage.getItem('taxistaBalance')) || 0.00;
    // NUEVO: Historial de retiros del taxista
    let taxistaWithdrawalHistory = JSON.parse(localStorage.getItem('taxistaWithdrawalHistory')) || [];


    const updateTaxistaBalanceDisplay = () => {
        if (taxistaBalanceDisplay) {
            taxistaBalanceDisplay.textContent = taxistaBalance.toFixed(2);
            localStorage.setItem('taxistaBalance', taxistaBalance.toFixed(2));
        }
    };

    // NUEVO: Función para actualizar el historial de retiros del taxista en la UI
    const updateTaxistaWithdrawalHistoryDisplay = () => {
        if (taxistaWithdrawalHistoryList) {
            taxistaWithdrawalHistoryList.innerHTML = ''; // Clear current list

            if (taxistaWithdrawalHistory.length === 0) {
                taxistaWithdrawalHistoryList.innerHTML = '<li class="list-group-item text-center text-muted">No hay retiros registrados.</li>';
                return;
            }

            // Reverse to show most recent withdrawals first
            taxistaWithdrawalHistory.slice().reverse().forEach(withdrawal => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    <div>
                        <strong>Retiro: S/ ${withdrawal.amount.toFixed(2)}</strong><br>
                        <small>Fecha: ${new Date(withdrawal.timestamp).toLocaleString()}</small>
                    </div>
                    <span class="badge bg-danger rounded-pill">-S/ ${withdrawal.amount.toFixed(2)}</span>
                `;
                taxistaWithdrawalHistoryList.appendChild(listItem);
            });
            localStorage.setItem('taxistaWithdrawalHistory', JSON.stringify(taxistaWithdrawalHistory)); // Save to localStorage
        }
    };

    updateTaxistaBalanceDisplay();
    updateTaxistaWithdrawalHistoryDisplay(); // Initialize taxista withdrawal history display


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
                actionButtons = '<span class="badge bg-info py-2 px-3"><i class="bi bi-hourglass-split me-1"></i> Esperando Pago</span>';
            }
             else if (request.status === 'pagado') {
                statusClass = 'request-accepted';
                statusText = 'Viaje Pagado por usuario';
                // You might add a "Complete Trip" button here for the driver to finalize and remove the request
                actionButtons = '<span class="badge bg-success py-2 px-3"><i class="bi bi-check-circle-fill me-1"></i> Viaje Pagado</span>';
            }

            listItem.className = `list-group-item d-flex justify-content-between align-items-center mb-2 shadow-sm ${statusClass}`;
            listItem.innerHTML = `
                <div>
                    <h5>${request.origin} <i class="bi bi-arrow-right-short"></i> ${request.destination}</h5>
                    <p class="mb-1 text-muted">Servicio: ${request.serviceType} | Distancia: ${request.distance} km</p>
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
                    requests[requestIndex].status = 'taxistaAceptado';
                    localStorage.setItem('rideRequests', JSON.stringify(requests));

                    alert(`Taxista: Has aceptado el viaje a ${requests[requestIndex].destination} (${requests[requestIndex].serviceType}). El usuario ha sido notificado para realizar el pago.`);
                    loadRideRequests();
                }
            });
        });

        document.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const requestId = parseInt(e.target.dataset.id);
                let requests = JSON.parse(localStorage.getItem('rideRequests')) || [];
                requests = requests.filter(req => req.id !== requestId); // Remove rejected request
                localStorage.setItem('rideRequests', JSON.stringify(requests));
                alert('Taxista: Has rechazado el viaje.');
                loadRideRequests();
            });
        });
    };

    if (rideRequestsList) {
        loadRideRequests();
        window.addEventListener('storage', (event) => {
            if (event.key === 'rideRequests' || event.key === 'taxistaWithdrawalHistory') { // Listen for both keys
                loadRideRequests(); // Reload ride requests
                updateTaxistaWithdrawalHistoryDisplay(); // Also update withdrawal history in case of relevant changes
            }
        });
        setInterval(loadRideRequests, 5000);
    }

    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            const amount = parseFloat(withdrawAmountInput.value);
            if (!isNaN(amount) && amount > 0) {
                if (taxistaBalance >= amount) {
                    taxistaBalance -= amount;
                    updateTaxistaBalanceDisplay();
                    
                    // NUEVO: Añadir retiro al historial del taxista
                    const withdrawalEntry = {
                        amount: amount,
                        timestamp: Date.now()
                    };
                    taxistaWithdrawalHistory.push(withdrawalEntry);
                    updateTaxistaWithdrawalHistoryDisplay(); // Update display and localStorage

                    withdrawAmountInput.value = '';
                    alert(`Has retirado S/ ${amount.toFixed(2)}. Nuevo saldo: S/ ${taxistaBalance.toFixed(2)}.`);
                } else {
                    alert(`Saldo insuficiente para retirar. Tienes S/ ${taxistaBalance.toFixed(2)}.`);
                }
            } else {
                alert('Por favor, ingresa una cantidad válida para retirar.');
            }
        });
    }
});
