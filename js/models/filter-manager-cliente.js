// === Clase FilterManagerCliente ===
class FilterManagerCliente {
    constructor(clientesOriginales) {
      this.originalArray = clientesOriginales; // array original (sin filtros)
      this.searchArray = [...clientesOriginales]; // resultado actual filtrado
      this.filters = {
        texto: '',
        fechaDesde: '',
        fechaHasta: '',
        tipoDocumento: 'todo',
        observaciones: 'todo',
        estadoCliente: 'todo',
        orden: 'fecha' // por defecto
      };
      this.activeFilters = []; // solo para visualización
    }
    
    setTexto(texto) {
      this.filters.texto = texto.toLowerCase().trim();
      this.applyFilters();
    }
  
    setFechaDesde(fecha) {
      this.filters.fechaDesde = fecha;
    }
  
    setFechaHasta(fecha) {
      this.filters.fechaHasta = fecha;
    }
  
    setTipoDocumento(tipo) {
      this.filters.tipoDocumento = tipo;
    }
  
    setObservaciones(valor) {
      this.filters.observaciones = valor;
    }
  
    setEstadoCliente(valor) {
      this.filters.estadoCliente = valor;
    }
  
    setOrden(criterio) {
      this.filters.orden = criterio;
      //console.log(criterio);
      //console.log("Es diferente a fecha?",this.filters.orden==="fecha")
      this.applyFilters();
    }
    

    //Verificar si existe algun filtro aplicado
    hasFilters() {
        const f = this.filters;
        return (
          f.texto.trim() || 
          f.fechaDesde ||
          f.fechaHasta ||
          f.tipoDocumento !== 'todo' ||
          f.observaciones !== 'todo' ||
          f.estadoCliente !== 'todo' 
        );
      }
    

    onlyOrdenamiento() {
      return this.filters.orden !== 'fecha';
    }
  
    renderOnlyOrdenamiento(){
        console.log("es",this.filters.orden);
        if(!this.onlyOrdenamiento){
            this.applyOrdenamiento(); 
        }
        renderClientes();    
    }
      

   
      
    applyFilters() {
      const { texto, fechaDesde, fechaHasta, tipoDocumento, observaciones, estadoCliente } = this.filters;
      const clientes = this.originalArray.filter(cliente => {
  
        const textoMatch = texto === '' || [cliente.nombre, cliente.numeroDocumento, cliente.telefono, cliente.email]
          .some(campo => campo?.toLowerCase().includes(texto));


        const fechaMatch = (!fechaDesde || crearFechaExacta(cliente.fechaRegistro) >= crearFechaExacta(normalizarFecha(fechaDesde))) &&
                           (!fechaHasta || crearFechaExacta(cliente.fechaRegistro) <= crearFechaExacta(normalizarFecha(fechaHasta)));

        //console.log(this.crearFechaExacta(this.normalizarFecha(fechaDesde)));
        //console.log(cliente.fechaRegistro);
        //console.log(this.crearFechaExacta(cliente.fechaRegistro));
        //console.log(this.crearFechaExacta(this.normalizarFecha(fechaHasta)));


        const tipoDocMatch = tipoDocumento === 'todo' || cliente.tipoDocumento === tipoDocumento;

        const observacionMatch =
          observaciones === 'todo' ||
          (observaciones === 'con' && cliente.observaciones?.trim() !== '') ||
          (observaciones === 'sin' && (!cliente.observaciones || cliente.observaciones.trim() === ''));



        const ingresos = window.templatesStore.getIngresosByCliente(cliente.id);
        const egresos = window.templatesStore.getEgresosByCliente(cliente.id);
        const saldo = window.templatesStore.calcularBalanceCliente(cliente.id);

        //console.log(estadoCliente);

        const estadoMatch =
          estadoCliente === 'todo' ||
          (estadoCliente === 'activos' && (ingresos.length > 0 || egresos.length > 0)) ||
          (estadoCliente === 'sinTransacciones' && ingresos.length === 0 && egresos.length === 0) ||
          (estadoCliente === 'saldoPositivo' && saldo > 0) ||
          (estadoCliente === 'saldoCero' && saldo === 0);
        
        return textoMatch && fechaMatch && tipoDocMatch && observacionMatch && estadoMatch;
      });
  
      this.searchArray = [...clientes];
      
      this.applyOrdenamiento();
      this.updateActiveFilters();
      renderClientes();
    }
  

    applyOrdenamiento() {
      const criterio = this.filters.orden;
      const clientes = this.searchArray;
  
      switch (criterio) {
        case 'nombre':
          clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
          break;
        case 'mayorSaldo':
          clientes.sort((a, b) => window.templatesStore.calcularBalanceCliente(b.id) - window.templatesStore.calcularBalanceCliente(a.id));
          break;
        case 'menorSaldo':
          clientes.sort((a, b) => window.templatesStore.calcularBalanceCliente(a.id) - window.templatesStore.calcularBalanceCliente(b.id));
          break;
        case 'mayorIngreso':
          clientes.sort((a, b) => {
            const sumaA = window.templatesStore.getIngresosByCliente(a.id).reduce((s, i) => s + parseFloat(i.importe), 0);
            const sumaB = window.templatesStore.getIngresosByCliente(b.id).reduce((s, i) => s + parseFloat(i.importe), 0);
            return sumaB - sumaA;
          });
          break;
        case 'mayorEgreso':
          clientes.sort((a, b) => {
            const sumaA = window.templatesStore.getEgresosByCliente(a.id).reduce((s, e) => s + parseFloat(e.importe), 0);
            const sumaB = window.templatesStore.getEgresosByCliente(b.id).reduce((s, e) => s + parseFloat(e.importe), 0);
            return sumaB - sumaA;
          });
          break;
        default:
          clientes.sort((a, b) => crearFechaExacta(b.fechaRegistro) - crearFechaExacta(a.fechaRegistro));
      }
      this.searchArray = clientes;
    }
    
  
    updateActiveFilters() {
      const f = this.filters;
      this.activeFilters = [];
  
      if (f.texto) this.activeFilters.push(`Texto: "${f.texto}"`);
      if (f.fechaDesde || f.fechaHasta) this.activeFilters.push(`Fecha: ${f.fechaDesde || '...'} → ${f.fechaHasta || '...'}`);
      if (f.tipoDocumento !== 'todo') this.activeFilters.push(`Tipo doc: ${f.tipoDocumento}`);
      if (f.observaciones !== 'todo') this.activeFilters.push(`Observaciones: ${f.observaciones}`);
      if (f.estadoCliente !== 'todo') this.activeFilters.push(`Estado: ${f.estadoCliente}`);
    }
  
    resetFilters() {
      const orden=this.filters.orden;  
      this.filters = {
        texto: '',
        fechaDesde: '',
        fechaHasta: '',
        tipoDocumento: 'todo',
        observaciones: 'todo',
        estadoCliente: 'todo'
      };
      this.searchArray = [...this.originalArray];
      this.activeFilters = [];
      //this.applyOrdenamiento();
      this.renderOnlyOrdenamiento();
      document.getElementById("btn-remover-filtros-cliente").classList.add("hidden");
    }

    //En caso se modifique el array de Clientes(edicion,eliminacion o nuevo cliente)
    refreshFromStore() {
        this.originalArray = window.templatesStore.getClientes();
        //Hay algun filtro aplicado, no toma en cuenta ordenamientos
        if(this.hasFilters()){
            this.applyFilters(); 
        }else{
            this.renderOnlyOrdenamiento();
        }
    }

  }
  
  // Exporta clase para usar en store u otros módulos
  const clienteFilter = new FilterManagerCliente(window.templatesStore.getClientes());
  window.clienteFilter = clienteFilter;
