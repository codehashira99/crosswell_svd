# Crosswell Tomography using SVD Inversion

A comprehensive web-based visualization tool for crosswell seismic tomography using Singular Value Decomposition (SVD) inversion algorithms. This application provides real-time ray path visualization, interactive parameter controls, and detailed inversion statistics for geophysical analysis.

## 🚀 Features

### Core Functionality
- **Real-time Ray Path Visualization**: Interactive plotting of seismic ray paths between boreholes
- **SVD Inversion Algorithm**: Implementation of Singular Value Decomposition for tomographic reconstruction
- **Multi-depth Analysis**: Support for various source depths (100m to 1600m)
- **Interactive Controls**: Dynamic parameter adjustment with immediate visualization updates
- **Statistical Analysis**: Comprehensive inversion statistics including matrix rank, singular values, and model parameters

### Visualization Components
- **Ray Path Diagrams**: Color-coded ray trajectories with depth visualization
- **Heatmap Generation**: Velocity model reconstruction visualization
- **L-curve Analysis**: Regularization parameter optimization plots
- **Resolution Analysis**: Model resolution and data coverage assessment
- **Modal Displays**: Full-screen heatmap viewing capabilities

### Technical Features
- **Browser-based Interface**: No installation required, runs directly in web browsers
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Real-time Computation**: Instant feedback on parameter changes
- **Export Capabilities**: Save plots and analysis results

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Modern semantic structure with responsive layout
- **CSS3**: Advanced styling with grid layouts, animations, and responsive design
- **JavaScript (ES6+)**: Client-side computation and interactive controls
- **Plotly.js**: Advanced scientific plotting and visualization

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework for API endpoints
- **File System Operations**: Dynamic data processing and visualization generation

### Mathematical Libraries
- **SVD Implementation**: Custom Singular Value Decomposition algorithms
- **Matrix Operations**: Linear algebra computations for tomographic inversion
- **Numerical Methods**: Optimization and regularization techniques

## 📋 Prerequisites

- Node.js (version 14.0 or higher)
- npm (Node Package Manager)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Minimum 4GB RAM recommended for large datasets

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/crosswell-tomography-svd.git
   cd crosswell-tomography-svd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000` in your web browser

## 📁 Project Structure

'''
crosswell-tomography-svd/
├── public/
│   ├── index.html              # Main application interface
│   ├── css/
│   │   └── styles.css          # Application styling
│   ├── js/
│   │   ├── main.js             # Core application logic
│   │   ├── svd-algorithms.js   # SVD inversion implementations
│   │   ├── plotting.js         # Visualization functions
│   │   └── utils.js            # Utility functions
│   └── data/
│       ├── velocity-models/    # Reference velocity models
│       └── ray-data/           # Precomputed ray path data
├── server/
│   ├── app.js                  # Express server configuration
│   ├── routes/
│   │   ├── api.js              # API endpoints
│   │   └── data.js             # Data processing routes
│   └── algorithms/
│       ├── svd-inversion.js    # Core SVD algorithms
│       ├── ray-tracing.js      # Ray path calculations
│       └── tomography.js       # Tomographic reconstruction
├── package.json                # Project dependencies
├── package-lock.json           # Dependency lock file
└── README.md                   # This file
'''

## 🎯 Usage

### Basic Operation

1. **Select Source Depth**: Use the dropdown menu to choose seismic source depth (100m-1600m)
2. **View Ray Paths**: Interactive ray path diagram shows seismic wave trajectories
3. **Analyze Statistics**: Right panel displays inversion parameters and matrix properties
4. **Generate Heatmaps**: Click controls to create velocity model visualizations
5. **View L-curves**: Analyze regularization parameters for optimal inversion

### Advanced Features

#### SVD Inversion Parameters
- **Matrix Rank**: Indicates the effective degrees of freedom in the inversion
- **Singular Values**: Shows the stability and conditioning of the inverse problem
- **Data Points**: Number of seismic ray measurements
- **Model Parameters**: Grid points in the velocity model

#### Visualization Options
- **Ray Path Colors**: Represent different wave types or arrival times
- **Heatmap Scaling**: Adjust velocity scale for optimal visualization
- **Resolution Analysis**: View model resolution matrix and data coverage
- **Export Options**: Save plots as high-resolution images

### Mathematical Background

The application implements the SVD-based inversion equation:
```
A = U Σ V^T
```

Where:
- **A**: Forward modeling matrix (ray path geometry)
- **U**: Left singular vectors (data space)
- **Σ**: Diagonal matrix of singular values
- **V^T**: Right singular vectors (model space)

The velocity model is reconstructed using:
```
m = V Σ^(-1) U^T d
```

Where:
- **m**: Model parameters (velocity values)
- **d**: Data vector (travel times)

## 🔬 Scientific Applications

### Geophysical Surveys
- **Subsurface Imaging**: High-resolution velocity structure mapping
- **Geological Characterization**: Rock property determination
- **Fluid Monitoring**: Time-lapse velocity changes
- **Engineering Applications**: Foundation studies and tunnel planning

### Research Applications
- **Algorithm Development**: Testing new inversion methodologies
- **Parameter Studies**: Sensitivity analysis of inversion parameters
- **Data Quality Assessment**: Ray coverage and resolution analysis
- **Educational Tool**: Teaching tomographic principles

## 📊 Data Formats

### Input Data
- **Travel Time Data**: ASCII format with source-receiver pairs
- **Geometry Files**: Borehole coordinates and measurement positions
- **Velocity Models**: Reference models for comparison

### Output Formats
- **PNG Images**: High-resolution plots and heatmaps
- **JSON Data**: Numerical results and statistics
- **CSV Files**: Tabulated inversion results

## 🚀 Performance Optimization

### Client-Side Optimization
- **Efficient Plotting**: Optimized Plotly.js configurations
- **Memory Management**: Proper cleanup of large datasets
- **Responsive Updates**: Debounced parameter changes
- **Caching**: Browser storage for computed results

### Server-Side Optimization
- **Algorithm Efficiency**: Optimized SVD implementations
- **Parallel Processing**: Multi-threaded computations where applicable
- **Memory Usage**: Efficient matrix operations
- **Response Compression**: Gzipped data transfer

### Browser Compatibility
- Chrome 80+ (Recommended)
- Firefox 75+
- Safari 13+
- Edge 80+


### Technical Documentation
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [Node.js API Documentation](https://nodejs.org/en/docs/)
- [SVD Mathematical Background](https://en.wikipedia.org/wiki/Singular_value_decomposition)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

